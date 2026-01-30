import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import Swal from "sweetalert2";
import {
     fetchDepositPolicies,
     createDepositPolicy,
     updateDepositPolicy,
     deleteDepositPolicy
} from "../../../shared/services/depositPolicies";
import {
     fetchFields,
     fetchComplexes,
     fetchAllComplexesWithFields,
     fetchTimeSlotsByField
} from "../../../shared/index";

export default function DepositPolicies({ isDemo = false }) {
     const { user } = useAuth();
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
     const [slotPriceInfo, setSlotPriceInfo] = useState({
          loading: false,
          min: null,
          max: null,
          error: null,
          source: null
     });
     // lấy userId 
     const currentUserId = useMemo(() => {
          const id =
               user?.userID ??
               user?.UserID ??
               user?.id ??
               user?.userId ??
               null;
          return id != null ? Number(id) : null;
     }, [user?.UserID, user?.id, user?.userID, user?.userId]);
     // Hàm lấy giá fallback từ thông tin sân
     const getFallbackPriceForField = useCallback((fieldId) => {
          if (!fieldId) return null;
          const field = fields.find((f) => String(f.fieldId) === String(fieldId));
          if (!field) return null;
          const price =
               field.pricePerHour ??
               field.PricePerHour ??
               field.priceForSelectedSlot ??
               field.price ??
               0;
          return price && !Number.isNaN(Number(price)) ? Number(price) : null;
     }, [fields]);
     // Hàm tải dữ liệu chính sách và sân
     const loadData = useCallback(async () => {
          try {
               setLoading(true);
               let policiesData = [];
               if (!isDemo) {
                    policiesData = await fetchDepositPolicies();
               }

               let fieldsData = [];
               if (isDemo) {
                    const complexesData = await fetchComplexes();
                    const ownerComplexes = complexesData.filter(complex =>
                         complex.complexId === 101 || complex.complexId === 102 || complex.complexId === 103
                    );
                    // Lấy sân từ các cụm sân của chủ sở hữu
                    for (const complex of ownerComplexes) {
                         const complexFields = await fetchFields({ complexId: complex.complexId });
                         fieldsData.push(...complexFields.map((field) => {
                              const rawFieldId = field.fieldId ?? field.FieldID ?? field.id;
                              const numericFieldId = Number(rawFieldId);
                              const fieldId = Number.isNaN(numericFieldId) ? rawFieldId : numericFieldId;
                              return {
                                   fieldId,
                                   name: field.name || field.fieldName || field.FieldName || `Field ${fieldId}`,
                                   typeName: field.typeName || field.TypeName || "",
                                   complexId: field.complexId ?? complex.complexId,
                                   complexName: field.complexName || complex.name || "",
                                   status: field.status || field.Status || "Available",
                                   pricePerHour: Number(field.pricePerHour ?? field.PricePerHour ?? field.priceForSelectedSlot ?? field.price ?? 0) || null,
                              };
                         }));
                    }
               } else if (currentUserId) {
                    // Lấy tất cả cụm sân và lọc theo ownerId
                    const allComplexesWithFields = await fetchAllComplexesWithFields();
                    const ownerComplexes = allComplexesWithFields.filter(
                         complex => Number(complex.ownerId) === Number(currentUserId)
                    );
                    // Lấy sân từ các cụm sân của chủ sở hữu
                    fieldsData = ownerComplexes.flatMap((complex) => {
                         return (complex.fields || []).map((field) => {
                              const rawFieldId = field.fieldId ?? field.FieldID ?? field.id;
                              const numericFieldId = Number(rawFieldId);
                              const fieldId = Number.isNaN(numericFieldId) ? rawFieldId : numericFieldId;
                              return {
                                   fieldId,
                                   name: field.name || field.fieldName || field.FieldName || `Field ${fieldId}`,
                                   typeName: field.typeName || field.TypeName || "",
                                   complexId: complex.complexId,
                                   complexName: complex.name || "",
                                   status: field.status || field.Status || "Available",
                                   pricePerHour: Number(field.pricePerHour ?? field.PricePerHour ?? field.price ?? 0) || null,
                              };
                         });
                    });
               }

               setPolicies(policiesData);
               setFields(fieldsData);
          } catch (error) {
               console.error('Error loading data:', error);
          } finally {
               setLoading(false);
          }
     }, [isDemo, currentUserId]);

     useEffect(() => {
          loadData();
     }, [loadData]);

     // Cập nhật thông tin giá slot khi chọn sân
     useEffect(() => {
          if (!formData.fieldId) {
               setSlotPriceInfo({
                    loading: false,
                    min: null,
                    max: null,
                    error: null,
                    source: null
               });
               return;
          }

          if (isDemo) {
               const fallbackPrice = getFallbackPriceForField(formData.fieldId);
               setSlotPriceInfo({
                    loading: false,
                    min: fallbackPrice,
                    max: fallbackPrice,
                    error: fallbackPrice ? null : "Chưa có giá slot cho sân này",
                    source: fallbackPrice ? "field" : null
               });
               return;
          }

          const numericFieldId = Number(formData.fieldId);
          if (!numericFieldId || Number.isNaN(numericFieldId)) {
               setSlotPriceInfo({
                    loading: false,
                    min: null,
                    max: null,
                    error: "ID sân không hợp lệ",
                    source: null
               });
               return;
          }
          // Tải giá slot từ API và tính toán giá min/max
          let isMounted = true;
          const loadSlotPrices = async () => {
               setSlotPriceInfo((prev) => ({
                    ...prev,
                    loading: true,
                    error: null
               }));
               try {
                    const result = await fetchTimeSlotsByField(numericFieldId);
                    if (!isMounted) return;
                    const prices = Array.isArray(result?.data)
                         ? result.data
                              .map((slot) => Number(slot?.price ?? slot?.Price ?? slot?.pricePerHour ?? 0))
                              .filter((price) => !Number.isNaN(price) && price > 0)
                         : [];

                    if (prices.length > 0) {
                         setSlotPriceInfo({
                              loading: false,
                              min: Math.min(...prices),
                              max: Math.max(...prices),
                              error: null,
                              source: "timeslot"
                         });
                    } else {
                         const fallbackPrice = getFallbackPriceForField(numericFieldId);
                         setSlotPriceInfo({
                              loading: false,
                              min: fallbackPrice,
                              max: fallbackPrice,
                              error: fallbackPrice ? null : "Chưa thiết lập giá cho các slot của sân này.",
                              source: fallbackPrice ? "field" : null
                         });
                    }
               } catch (error) {
                    if (!isMounted) return;
                    const fallbackPrice = getFallbackPriceForField(numericFieldId);
                    setSlotPriceInfo({
                         loading: false,
                         min: fallbackPrice,
                         max: fallbackPrice,
                         error: error?.message || "Không thể tải giá slot.",
                         source: fallbackPrice ? "field" : null
                    });
               }
          };

          loadSlotPrices();

          return () => {
               isMounted = false;
          };
     }, [formData.fieldId, isDemo, getFallbackPriceForField]);

     const slotMinPrice = slotPriceInfo.min;
     const slotMaxPrice = slotPriceInfo.max;
     const depositPercent = formData.depositPercent;
     const canAutoCalculateDeposits = slotMinPrice != null && slotMaxPrice != null;
     const canSubmitPolicy = canAutoCalculateDeposits && !slotPriceInfo.loading;
     const priceSourceLabel = slotPriceInfo.source === "timeslot"
          ? "Giá slot thực tế"
          : slotPriceInfo.source === "field"
               ? "Giá mặc định của sân"
               : null;

     // Cập nhật tiền cọc khi thay đổi tỷ lệ đặt cọc hoặc giá slot
     useEffect(() => {
          if (slotMinPrice == null && slotMaxPrice == null) {
               setFormData((prev) => {
                    if (prev.minDeposit == null && prev.maxDeposit == null) return prev;
                    return { ...prev, minDeposit: null, maxDeposit: null };
               });
               return;
          }

          const percent = Number(depositPercent) || 0;
          setFormData((prev) => {
               const newMin = slotMinPrice != null ? Math.round((slotMinPrice * percent) / 100) : null;
               const newMax = slotMaxPrice != null ? Math.round((slotMaxPrice * percent) / 100) : null;

               if (newMin === prev.minDeposit && newMax === prev.maxDeposit) {
                    return prev;
               }

               return {
                    ...prev,
                    minDeposit: newMin,
                    maxDeposit: newMax
               };
          });
     }, [slotMinPrice, slotMaxPrice, depositPercent]);

     // thêm chính sách mới
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
     // sửa chính sách
     const handleEditPolicy = (policy) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setEditingPolicy(policy);
          setFormData({
               fieldId: policy.fieldId != null ? String(policy.fieldId) : '',
               depositPercent: policy.depositPercent,
               minDeposit: policy.minDeposit,
               maxDeposit: policy.maxDeposit
          });
          setShowModal(true);
     };
     // submit chính sách
     const handleSubmit = async (e) => {
          e.preventDefault();
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          if (!formData.fieldId) {
               alert('Vui lòng chọn sân trước khi lưu chính sách.');
               return;
          }

          const numericFieldId = Number(formData.fieldId);
          if (Number.isNaN(numericFieldId)) {
               alert('ID sân không hợp lệ.');
               return;
          }

          if (slotMinPrice == null || slotMaxPrice == null) {
               alert('Chưa thể tính tiền cọc vì sân chưa có giá slot. Vui lòng thiết lập giá slot trước.');
               return;
          }

          const payload = {
               fieldId: numericFieldId,
               depositPercent: Number(formData.depositPercent) || 0,
               minDeposit: formData.minDeposit ?? 0,
               maxDeposit: formData.maxDeposit ?? 0,
               createdAt: editingPolicy?.createdAt || ""
          };
          try {
               if (editingPolicy) {
                    await updateDepositPolicy(editingPolicy.depositPolicyId, payload);
               } else {
                    await createDepositPolicy(payload);
               }

               setShowModal(false);
               loadData();
          } catch (error) {
               console.error('Error saving policy:', error);
               alert(error.message || 'Có lỗi xảy ra khi lưu chính sách');
          }
     };
     // xóa chính sách
     const handleDeletePolicy = async (policy) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          const result = await Swal.fire({
               title: 'Xác nhận xóa',
               text: 'Bạn có chắc chắn muốn xóa chính sách này?',
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Xóa',
               cancelButtonText: 'Hủy'
          });

          if (!result.isConfirmed) return;

          try {
               await deleteDepositPolicy(policy.depositPolicyId, policy.fieldId);
               await Swal.fire({
                    icon: 'success',
                    title: 'Đã xóa',
                    text: 'Chính sách đã được xóa thành công',
                    timer: 1500,
                    showConfirmButton: false
               });
               loadData();
          } catch (error) {
               console.error('Error deleting policy:', error);
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Có lỗi xảy ra khi xóa chính sách'
               });
          }
     };
     // Lấy tên sân 
     const getFieldName = (fieldId) => {
          const targetField = fields.find(f => String(f.fieldId) === String(fieldId));
          return targetField ? `${targetField.complexName} - ${targetField.name}` : `Field ID: ${fieldId}`;
     };
     // Định dạng tiền VND
     const formatCurrency = (amount) => {
          if (amount === null || amount === undefined) return "Không giới hạn";
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(amount);
     };

     if (loading) {
          return (
               <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Đang tải...</div>
               </div>
          );
     }

     return (
          <div className="space-y-6">
               <div className="flex items-center justify-between">
                    <div>
                         <h1 className="text-3xl font-bold text-gray-900">Chính sách đặt cọc</h1>
                         <p className="text-gray-600 mt-1">Thiết lập chính sách đặt cọc cho các sân của bạn</p>
                    </div>
                    <Button onClick={handleCreatePolicy} className="flex items-center gap-2 rounded-2xl">
                         <Plus className="w-4 h-4 animate-pulse" />
                         Thêm chính sách
                    </Button>
               </div>

               {policies.length === 0 ? (
                    <Card className="p-4 rounded-2xl shadow-lg border border-teal-300">
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
                              <Card key={policy.depositPolicyId} className="p-4 rounded-2xl shadow-lg border bg-teal-50 border-teal-300">
                                   <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                             <div className="flex items-center gap-3 mb-2">
                                                  <h3 className="text-lg font-semibold text-gray-900">
                                                       {policy.fieldName || getFieldName(policy.fieldId)}
                                                  </h3>
                                             </div>

                                             <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                                                  <div className="flex items-center gap-1 text-teal-600 font-medium border border-teal-300 rounded-2xl px-2 py-1">
                                                       <Building2 className="w-4 h-4" />
                                                       <span> {getFieldName(policy.fieldId)}</span>
                                                  </div>
                                             </div>

                                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-2xl border border-blue-300">
                                                       <Percent className="w-5 h-5 text-blue-600" />
                                                       <div>
                                                            <p className="text-xs font-medium text-gray-600">Tỷ lệ đặt cọc</p>
                                                            <p className="text-sm font-semibold text-blue-900">
                                                                 {policy.depositPercent}%
                                                            </p>
                                                       </div>
                                                  </div>
                                                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-2xl border border-green-300">
                                                       <DollarSign className="w-5 h-5 text-green-600" />
                                                       <div>
                                                            <p className="text-xs font-medium text-gray-600">Cọc tối thiểu</p>
                                                            <p className="text-sm font-semibold text-green-900">
                                                                 {formatCurrency(policy.minDeposit)}
                                                            </p>
                                                       </div>
                                                  </div>
                                                  <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-2xl border border-purple-300">
                                                       <DollarSign className="w-5 h-5 text-purple-600" />
                                                       <div>
                                                            <p className="text-xs font-medium text-gray-600">Cọc tối đa</p>
                                                            <p className="text-sm font-semibold text-purple-900">
                                                                 {formatCurrency(policy.maxDeposit)}
                                                            </p>
                                                       </div>
                                                  </div>
                                             </div>

                                             {policy.createdAt && (
                                                  <p className="text-xs font-medium text-gray-600 mt-4">
                                                       Tạo lúc: {new Date(policy.createdAt).toLocaleString('vi-VN')}
                                                  </p>
                                             )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                             <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleEditPolicy(policy)}
                                                  className="flex items-center gap-1 rounded-2xl"
                                             >
                                                  <Edit className="w-4 h-4 animate-pulse" />
                                                  Sửa
                                             </Button>
                                             <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleDeletePolicy(policy)}
                                                  className="flex items-center gap-1 text-red-600 hover:text-red-700 rounded-2xl"
                                             >
                                                  <Trash2 className="w-4 h-4 animate-pulse" />
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
                                   value={formData.fieldId ?? ''}
                                   onChange={(e) => setFormData({
                                        ...formData,
                                        fieldId: e.target.value,
                                        minDeposit: null,
                                        maxDeposit: null
                                   })}
                                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   required
                              >
                                   <option value="">Chọn sân</option>
                                   {fields.map((field) => {
                                        const isMaintenance = (field.status || "").toLowerCase() === "maintenance".toLowerCase();
                                        const hasPolicy = policies.some(p => String(p.fieldId) === String(field.fieldId));
                                        // Khi thêm mới: disable sân đã có chính sách hoặc đang bảo trì
                                        // Khi sửa: chỉ disable sân khác đã có chính sách (cho phép giữ sân hiện tại)
                                        const isOptionDisabled = !editingPolicy
                                             ? (hasPolicy || isMaintenance)
                                             : (hasPolicy && String(editingPolicy.fieldId) !== String(field.fieldId));
                                        const label = `${field.complexName} - ${field.name} (${field.typeName})${isMaintenance ? " - Bảo trì" : ""}${hasPolicy && !editingPolicy ? " - Đã có chính sách" : ""}`;
                                        return (
                                             <option
                                                  key={field.fieldId}
                                                  value={String(field.fieldId)}
                                                  disabled={isOptionDisabled}
                                             >
                                                  {label}
                                             </option>
                                        );
                                   })}
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
                                   onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        const normalized = Number.isNaN(value) ? 0 : Math.min(Math.max(value, 0), 100);
                                        setFormData({ ...formData, depositPercent: normalized });
                                   }}
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
                                        type="text"
                                        readOnly
                                        value={
                                             slotPriceInfo.loading
                                                  ? 'Đang tính...'
                                                  : formData.minDeposit != null
                                                       ? formatCurrency(formData.minDeposit)
                                                       : 'Chưa có dữ liệu'
                                        }
                                        className="bg-gray-50 cursor-not-allowed"
                                   />
                                   <p className="text-xs text-gray-500 mt-1">
                                        {slotPriceInfo.loading
                                             ? 'Đang tải giá slot...'
                                             : slotMinPrice != null
                                                  ? `Slot rẻ nhất: ${formatCurrency(slotMinPrice)}`
                                                  : 'Vui lòng thiết lập giá slot cho sân này.'}
                                   </p>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cọc tối đa (VND)
                                   </label>
                                   <Input
                                        type="text"
                                        readOnly
                                        value={
                                             slotPriceInfo.loading
                                                  ? 'Đang tính...'
                                                  : formData.maxDeposit != null
                                                       ? formatCurrency(formData.maxDeposit)
                                                       : 'Chưa có dữ liệu'
                                        }
                                        className="bg-gray-50 cursor-not-allowed"
                                   />
                                   <p className="text-xs text-gray-500 mt-1">
                                        {slotPriceInfo.loading
                                             ? 'Đang tải giá slot...'
                                             : slotMaxPrice != null
                                                  ? `Slot cao nhất: ${formatCurrency(slotMaxPrice)}`
                                                  : 'Vui lòng thiết lập giá slot cho sân này.'}
                                   </p>
                              </div>
                         </div>

                         {!slotPriceInfo.loading && slotPriceInfo.error && (
                              <p className="text-xs text-amber-600">
                                   {slotPriceInfo.error}
                              </p>
                         )}

                         {priceSourceLabel && (
                              <p className="text-xs text-gray-500">
                                   Tiền cọc được tính dựa trên {priceSourceLabel.toLowerCase()} của sân.
                              </p>
                         )}

                         {!slotPriceInfo.loading && formData.fieldId && !canAutoCalculateDeposits && (
                              <p className="text-xs text-red-500">
                                   Chưa tìm thấy giá slot cho sân này. Vui lòng thiết lập giá slot trước khi tạo chính sách.
                              </p>
                         )}

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
                              <Button
                                   type="submit"
                                   disabled={!canSubmitPolicy}
                                   title={!canSubmitPolicy ? 'Cần có dữ liệu giá slot để tính tiền cọc' : undefined}
                              >
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
     );
}

