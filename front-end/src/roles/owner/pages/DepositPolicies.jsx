import React, { useState, useEffect, useCallback } from "react";
import OwnerLayout from "../layouts/OwnerLayout";
import { useAuth } from "../../../contexts/AuthContext";
import { Card, Button, Input, Modal } from "../../../shared/components/ui";
import { DemoRestrictedModal } from "../../../shared";
import {
     Shield,
     Plus,
     Edit,
     Trash2,
     Percent,
     DollarSign,
     Building2,
     AlertTriangle,
} from "lucide-react";
import {
     fetchDepositPolicies,
     createDepositPolicy,
     updateDepositPolicy,
     deleteDepositPolicy
} from "../../../shared/services/depositPolicies";
import { fetchFields, fetchComplexes } from "../../../shared/index";

export default function DepositPolicies({ isDemo = false }) {
     const { user, logout } = useAuth();
     const [policies, setPolicies] = useState([]);
     const [fields, setFields] = useState([]);
     const [loading, setLoading] = useState(true);
     const [showModal, setShowModal] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [editingPolicy, setEditingPolicy] = useState(null);
     const [formData, setFormData] = useState({
          fieldId: '',
          depositPercent: 0,
          minDeposit: null,
          maxDeposit: null
     });

     const loadData = useCallback(async () => {
          try {
               setLoading(true);

               // Fetch deposit policies
               let policiesData = [];
               if (!isDemo) {
                    policiesData = await fetchDepositPolicies();
               }

               // Fetch fields for dropdown
               const complexesData = await fetchComplexes();
               const ownerComplexes = complexesData.filter(complex =>
                    complex.complexId === 101 || complex.complexId === 102 || complex.complexId === 103
               );

               const fieldsData = [];
               for (const complex of ownerComplexes) {
                    const complexFields = await fetchFields({ complexId: complex.complexId });
                    fieldsData.push(...complexFields);
               }

               setPolicies(policiesData);
               setFields(fieldsData);
          } catch (error) {
               console.error('Error loading data:', error);
          } finally {
               setLoading(false);
          }
     }, [isDemo]);

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
               fieldId: '',
               depositPercent: 0,
               minDeposit: null,
               maxDeposit: null
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
               fieldId: policy.fieldId,
               depositPercent: policy.depositPercent,
               minDeposit: policy.minDeposit,
               maxDeposit: policy.maxDeposit
          });
          setShowModal(true);
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          try {
               if (editingPolicy) {
                    await updateDepositPolicy(editingPolicy.depositPolicyId, formData);
               } else {
                    await createDepositPolicy(formData);
               }

               setShowModal(false);
               loadData();
          } catch (error) {
               console.error('Error saving policy:', error);
               alert(error.message || 'Có lỗi xảy ra khi lưu chính sách');
          }
     };

     const handleDeletePolicy = async (policyId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          if (window.confirm('Bạn có chắc chắn muốn xóa chính sách này?')) {
               try {
                    await deleteDepositPolicy(policyId);
                    loadData();
               } catch (error) {
                    console.error('Error deleting policy:', error);
                    alert(error.message || 'Có lỗi xảy ra khi xóa chính sách');
               }
          }
     };

     const getFieldName = (fieldId) => {
          const field = fields.find(f => f.fieldId === fieldId);
          return field ? `${field.complexName} - ${field.name}` : `Field ID: ${fieldId}`;
     };

     const formatCurrency = (amount) => {
          if (!amount) return "Không giới hạn";
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(amount);
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
                              <h1 className="text-3xl font-bold text-gray-900">Chính sách đặt cọc</h1>
                              <p className="text-gray-600 mt-1">Thiết lập chính sách đặt cọc cho các sân của bạn</p>
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
                                   <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có chính sách đặt cọc</h3>
                                   <p className="text-gray-500 mb-4">Tạo chính sách đặt cọc đầu tiên cho sân của bạn</p>
                                   <Button onClick={handleCreatePolicy} className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Tạo chính sách
                                   </Button>
                              </div>
                         </Card>
                    ) : (
                         <div className="grid gap-6">
                              {policies.map((policy) => (
                                   <Card key={policy.depositPolicyId} className="p-6">
                                        <div className="flex items-start justify-between">
                                             <div className="flex-1">
                                                  <div className="flex items-center gap-3 mb-2">
                                                       <h3 className="text-lg font-semibold text-gray-900">
                                                            {policy.fieldName || getFieldName(policy.fieldId)}
                                                       </h3>
                                                  </div>

                                                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                                                       <div className="flex items-center gap-1">
                                                            <Building2 className="w-4 h-4" />
                                                            <span>Sân: {getFieldName(policy.fieldId)}</span>
                                                       </div>
                                                  </div>

                                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                       <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                                            <Percent className="w-5 h-5 text-blue-600" />
                                                            <div>
                                                                 <p className="text-xs text-gray-500">Tỷ lệ đặt cọc</p>
                                                                 <p className="text-sm font-semibold text-blue-900">
                                                                      {policy.depositPercent}%
                                                                 </p>
                                                            </div>
                                                       </div>
                                                       <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                                                            <DollarSign className="w-5 h-5 text-green-600" />
                                                            <div>
                                                                 <p className="text-xs text-gray-500">Cọc tối thiểu</p>
                                                                 <p className="text-sm font-semibold text-green-900">
                                                                      {formatCurrency(policy.minDeposit)}
                                                                 </p>
                                                            </div>
                                                       </div>
                                                       <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                                                            <DollarSign className="w-5 h-5 text-purple-600" />
                                                            <div>
                                                                 <p className="text-xs text-gray-500">Cọc tối đa</p>
                                                                 <p className="text-sm font-semibold text-purple-900">
                                                                      {formatCurrency(policy.maxDeposit)}
                                                                 </p>
                                                            </div>
                                                       </div>
                                                  </div>

                                                  {policy.createdAt && (
                                                       <p className="text-xs text-gray-400 mt-4">
                                                            Tạo lúc: {new Date(policy.createdAt).toLocaleString('vi-VN')}
                                                       </p>
                                                  )}
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
                                                       onClick={() => handleDeletePolicy(policy.depositPolicyId)}
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
                         title={editingPolicy ? 'Chỉnh sửa chính sách đặt cọc' : 'Tạo chính sách đặt cọc mới'}
                    >
                         <form onSubmit={handleSubmit} className="space-y-4">
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chọn sân <span className="text-red-500">*</span>
                                   </label>
                                   <select
                                        value={formData.fieldId}
                                        onChange={(e) => setFormData({ ...formData, fieldId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                   >
                                        <option value="">Chọn sân</option>
                                        {fields.map((field) => (
                                             <option key={field.fieldId} value={field.fieldId}>
                                                  {field.complexName} - {field.name} ({field.typeName})
                                             </option>
                                        ))}
                                   </select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tỷ lệ đặt cọc (%) <span className="text-red-500">*</span>
                                   </label>
                                   <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={formData.depositPercent}
                                        onChange={(e) => setFormData({ ...formData, depositPercent: parseFloat(e.target.value) || 0 })}
                                        placeholder="Ví dụ: 50"
                                        required
                                   />
                                   <p className="text-xs text-gray-500 mt-1">Nhập phần trăm cần đặt cọc (0-100)</p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Cọc tối thiểu (VND)
                                        </label>
                                        <Input
                                             type="number"
                                             min="0"
                                             value={formData.minDeposit || ''}
                                             onChange={(e) => setFormData({ ...formData, minDeposit: e.target.value ? parseFloat(e.target.value) : null })}
                                             placeholder="Không giới hạn"
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Cọc tối đa (VND)
                                        </label>
                                        <Input
                                             type="number"
                                             min="0"
                                             value={formData.maxDeposit || ''}
                                             onChange={(e) => setFormData({ ...formData, maxDeposit: e.target.value ? parseFloat(e.target.value) : null })}
                                             placeholder="Không giới hạn"
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
                         featureName="Chính sách Đặt cọc"
                    />
               </div>
          </OwnerLayout>
     );
}

