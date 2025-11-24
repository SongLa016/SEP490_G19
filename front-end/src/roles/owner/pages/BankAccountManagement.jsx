import React, { useState, useEffect, useCallback } from "react";
import OwnerLayout from "../layouts/OwnerLayout";
import { useAuth } from "../../../contexts/AuthContext";
import { Card, Button, Input, Modal, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shared/components/ui";
import { DemoRestrictedModal } from "../../../shared";
import {
     CreditCard,
     Plus,
     Edit,
     Trash2,
     Building2,
     User,
     Hash,
     Star,
     Loader2,
     CheckCircle,
     AlertCircle
} from "lucide-react";
import Swal from "sweetalert2";
import {
     fetchOwnerBankAccounts,
     createOwnerBankAccount,
     updateOwnerBankAccount,
     deleteOwnerBankAccount,
     setDefaultBankAccount
} from "../../../shared/services/ownerBankAccount";

// Common Vietnamese bank codes
const BANK_CODES = [
     { code: "VCB", name: "Vietcombank" },
     { code: "TCB", name: "Techcombank" },
     { code: "BID", name: "BIDV" },
     { code: "CTG", name: "VietinBank" },
     { code: "ACB", name: "ACB" },
     { code: "VIB", name: "VIB" },
     { code: "TPB", name: "TPBank" },
     { code: "MSB", name: "MSB" },
     { code: "VPB", name: "VPBank" },
     { code: "HDB", name: "HDBank" },
     { code: "SHB", name: "SHB" },
     { code: "STB", name: "Sacombank" },
     { code: "EIB", name: "Eximbank" },
     { code: "OCB", name: "OCB" },
     { code: "MBB", name: "MB Bank" },
];

export default function BankAccountManagement({ isDemo = false }) {
     const { user, logout } = useAuth();
     const [bankAccounts, setBankAccounts] = useState([]);
     const [loading, setLoading] = useState(true);
     const [showModal, setShowModal] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [editingAccount, setEditingAccount] = useState(null);
     const [formData, setFormData] = useState({
          bankName: "",
          bankShortCode: "",
          accountNumber: "",
          accountHolder: "",
          isDefault: false
     });
     const [errors, setErrors] = useState({});

     const loadData = useCallback(async () => {
          try {
               setLoading(true);
               // Get UserID from user object (OwnerID references Users(UserID))
               const currentUserId = user?.userID || user?.UserID || user?.id || user?.userId;
               if (!isDemo && currentUserId) {
                    const accounts = await fetchOwnerBankAccounts(Number(currentUserId));
                    setBankAccounts(accounts || []);
               } else if (isDemo) {
                    // Demo data
                    setBankAccounts([
                         {
                              bankAccountId: 1,
                              ownerId: 1,
                              bankName: "Vietcombank",
                              bankShortCode: "VCB",
                              accountNumber: "1234567890",
                              accountHolder: "Nguyễn Văn A",
                              isDefault: true,
                         },
                         {
                              bankAccountId: 2,
                              ownerId: 1,
                              bankName: "Techcombank",
                              bankShortCode: "TCB",
                              accountNumber: "0987654321",
                              accountHolder: "Nguyễn Văn A",
                              isDefault: false,
                         }
                    ]);
               }
          } catch (error) {
               console.error('Error loading bank accounts:', error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể tải danh sách tài khoản ngân hàng',
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#ef4444'
               });
          } finally {
               setLoading(false);
          }
     }, [isDemo, user?.userID || user?.UserID || user?.id || user?.userId]);

     useEffect(() => {
          loadData();
     }, [loadData]);

     const handleInputChange = (e) => {
          const { name, value } = e.target;
          setFormData(prev => ({
               ...prev,
               [name]: value
          }));
          // Clear error when user starts typing
          if (errors[name]) {
               setErrors(prev => ({
                    ...prev,
                    [name]: ""
               }));
          }
     };

     const handleBankCodeChange = (code) => {
          const bank = BANK_CODES.find(b => b.code === code);
          setFormData(prev => ({
               ...prev,
               bankShortCode: code,
               bankName: bank ? bank.name : ""
          }));
          if (errors.bankShortCode) {
               setErrors(prev => ({
                    ...prev,
                    bankShortCode: ""
               }));
          }
     };

     const validateForm = () => {
          const newErrors = {};

          if (!formData.bankName.trim()) {
               newErrors.bankName = "Tên ngân hàng là bắt buộc";
          }

          if (!formData.bankShortCode.trim()) {
               newErrors.bankShortCode = "Mã ngân hàng là bắt buộc";
          }

          if (!formData.accountNumber.trim()) {
               newErrors.accountNumber = "Số tài khoản là bắt buộc";
          } else if (!/^[0-9]{8,20}$/.test(formData.accountNumber.replace(/\s/g, ''))) {
               newErrors.accountNumber = "Số tài khoản phải từ 8-20 chữ số";
          }

          if (!formData.accountHolder.trim()) {
               newErrors.accountHolder = "Tên chủ tài khoản là bắt buộc";
          }

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
     };

     const handleCreateAccount = () => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setEditingAccount(null);
          setFormData({
               bankName: "",
               bankShortCode: "",
               accountNumber: "",
               accountHolder: "",
               isDefault: false
          });
          setErrors({});
          setShowModal(true);
     };

     const handleEditAccount = (account) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setEditingAccount(account);
          setFormData({
               bankName: account.bankName,
               bankShortCode: account.bankShortCode,
               accountNumber: account.accountNumber,
               accountHolder: account.accountHolder,
               isDefault: account.isDefault
          });
          setErrors({});
          setShowModal(true);
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          if (!validateForm()) {
               Swal.fire({
                    icon: 'warning',
                    title: 'Vui lòng kiểm tra lại thông tin',
                    text: 'Có một số trường chưa hợp lệ',
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#f59e0b'
               });
               return;
          }

          try {
               // OwnerID must reference Users(UserID) from database
               const currentUserId = user?.userID || user?.UserID || user?.id || user?.userId;
               const accountData = {
                    ownerId: Number(currentUserId), // Ensure it's a number matching Users(UserID)
                    bankName: formData.bankName,
                    bankShortCode: formData.bankShortCode,
                    accountNumber: formData.accountNumber.replace(/\s/g, ''),
                    accountHolder: formData.accountHolder,
                    isDefault: formData.isDefault
               };

               if (editingAccount) {
                    await updateOwnerBankAccount(editingAccount.bankAccountId, accountData);
                    await Swal.fire({
                         icon: 'success',
                         title: 'Cập nhật thành công!',
                         text: 'Thông tin tài khoản ngân hàng đã được cập nhật.',
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#10b981'
                    });
               } else {
                    await createOwnerBankAccount(accountData);
                    await Swal.fire({
                         icon: 'success',
                         title: 'Tạo thành công!',
                         text: 'Tài khoản ngân hàng đã được thêm.',
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#10b981'
                    });
               }

               setShowModal(false);
               resetForm();
               loadData();
          } catch (error) {
               console.error('Error saving bank account:', error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể lưu tài khoản ngân hàng',
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#ef4444'
               });
          }
     };

     const handleDeleteAccount = async (account) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          const result = await Swal.fire({
               title: 'Bạn có chắc chắn?',
               text: `Xóa tài khoản ${account.bankName} - ${account.accountNumber}?`,
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Xóa',
               cancelButtonText: 'Hủy'
          });

          if (result.isConfirmed) {
               try {
                    await deleteOwnerBankAccount(account.bankAccountId);
                    await Swal.fire({
                         icon: 'success',
                         title: 'Đã xóa!',
                         text: 'Tài khoản ngân hàng đã được xóa.',
                         confirmButtonColor: '#10b981',
                         timer: 2000
                    });
                    loadData();
               } catch (error) {
                    console.error('Error deleting bank account:', error);
                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: error.message || 'Không thể xóa tài khoản ngân hàng',
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#ef4444'
                    });
               }
          }
     };

     const handleSetDefault = async (account) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          try {
               // OwnerID must reference Users(UserID) from database
               const currentUserId = user?.userID || user?.UserID || user?.id || user?.userId;
               await setDefaultBankAccount(account.bankAccountId, Number(currentUserId));
               await Swal.fire({
                    icon: 'success',
                    title: 'Đã đặt làm mặc định!',
                    text: `Tài khoản ${account.bankName} đã được đặt làm tài khoản mặc định.`,
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#10b981'
               });
               loadData();
          } catch (error) {
               console.error('Error setting default account:', error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể đặt tài khoản mặc định',
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#ef4444'
               });
          }
     };

     const resetForm = () => {
          setFormData({
               bankName: "",
               bankShortCode: "",
               accountNumber: "",
               accountHolder: "",
               isDefault: false
          });
          setErrors({});
          setEditingAccount(null);
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
                              <h1 className="text-3xl font-bold text-gray-900">Quản lý tài khoản ngân hàng</h1>
                              <p className="text-gray-600 mt-1">Thêm và quản lý tài khoản ngân hàng để nhận thanh toán</p>
                         </div>

                         <Button
                              onClick={handleCreateAccount}
                              className="flex items-center space-x-2 rounded-2xl"
                         >
                              <Plus className="w-4 h-4" />
                              <span>Thêm tài khoản</span>
                         </Button>
                    </div>

                    {/* Bank Accounts List */}
                    {bankAccounts.length === 0 ? (
                         <Card className="p-12 text-center">
                              <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                              <p className="text-gray-500 mb-4">Chưa có tài khoản ngân hàng nào. Hãy thêm tài khoản đầu tiên!</p>
                              <Button onClick={handleCreateAccount}>
                                   <Plus className="w-4 h-4 mr-2" />
                                   Thêm tài khoản ngân hàng
                              </Button>
                         </Card>
                    ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {bankAccounts.map((account) => (
                                   <Card key={account.bankAccountId} className="overflow-hidden hover:shadow-lg transition-all duration-300 rounded-2xl">
                                        <div className={`p-6 ${account.isDefault ? 'bg-gradient-to-br from-teal-50 to-blue-50 border-2 border-teal-200' : 'bg-white'}`}>
                                             <div className="flex items-start justify-between mb-4">
                                                  <div className="flex-1">
                                                       <div className="flex items-center space-x-2 mb-2">
                                                            <Building2 className="w-5 h-5 text-teal-600" />
                                                            <h3 className="text-lg font-bold text-gray-900">{account.bankName}</h3>
                                                            {account.isDefault && (
                                                                 <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full flex items-center">
                                                                      <Star className="w-3 h-3 mr-1 fill-current" />
                                                                      Mặc định
                                                                 </span>
                                                            )}
                                                       </div>
                                                       {account.bankShortCode && (
                                                            <p className="text-sm text-gray-500 mb-1">Mã: {account.bankShortCode}</p>
                                                       )}
                                                  </div>
                                             </div>

                                             <div className="space-y-3 mb-4">
                                                  <div className="flex items-center space-x-2">
                                                       <Hash className="w-4 h-4 text-gray-400" />
                                                       <div>
                                                            <p className="text-xs text-gray-500">Số tài khoản</p>
                                                            <p className="text-sm font-semibold text-gray-900">{account.accountNumber}</p>
                                                       </div>
                                                  </div>
                                                  <div className="flex items-center space-x-2">
                                                       <User className="w-4 h-4 text-gray-400" />
                                                       <div>
                                                            <p className="text-xs text-gray-500">Chủ tài khoản</p>
                                                            <p className="text-sm font-medium text-gray-900">{account.accountHolder}</p>
                                                       </div>
                                                  </div>
                                             </div>

                                             <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                                                  {!account.isDefault && (
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleSetDefault(account)}
                                                            className="flex-1 text-xs border-teal-200 text-teal-600 hover:bg-teal-50"
                                                       >
                                                            <Star className="w-3 h-3 mr-1" />
                                                            Đặt mặc định
                                                       </Button>
                                                  )}
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => handleEditAccount(account)}
                                                       className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                                  >
                                                       <Edit className="w-4 h-4" />
                                                  </Button>
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => handleDeleteAccount(account)}
                                                       className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                  >
                                                       <Trash2 className="w-4 h-4" />
                                                  </Button>
                                             </div>
                                        </div>
                                   </Card>
                              ))}
                         </div>
                    )}

                    {/* Add/Edit Modal */}
                    <Modal
                         isOpen={showModal}
                         onClose={() => {
                              setShowModal(false);
                              resetForm();
                         }}
                         title={editingAccount ? "Chỉnh sửa tài khoản ngân hàng" : "Thêm tài khoản ngân hàng mới"}
                         className="max-w-2xl rounded-2xl shadow-lg px-3 max-h-[90vh] overflow-y-auto scrollbar-hide"
                    >
                         <form onSubmit={handleSubmit} className="space-y-4">
                              {/* Bank Short Code */}
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Building2 className="w-4 h-4 inline mr-1 text-blue-600" />
                                        Ngân hàng <span className="text-red-500">*</span>
                                   </label>
                                   <Select
                                        value={formData.bankShortCode}
                                        onValueChange={handleBankCodeChange}
                                   >
                                        <SelectTrigger className={errors.bankShortCode ? 'border-red-500' : ''}>
                                             <SelectValue placeholder="Chọn ngân hàng" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {BANK_CODES.map(bank => (
                                                  <SelectItem key={bank.code} value={bank.code}>
                                                       {bank.name} ({bank.code})
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                                   {errors.bankShortCode && (
                                        <p className="text-xs text-red-600 mt-1">{errors.bankShortCode}</p>
                                   )}
                              </div>

                              {/* Bank Name (auto-filled but editable) */}
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên ngân hàng <span className="text-red-500">*</span>
                                   </label>
                                   <Input
                                        name="bankName"
                                        value={formData.bankName}
                                        onChange={handleInputChange}
                                        placeholder="Nhập tên ngân hàng"
                                        required
                                        className={errors.bankName ? 'border-red-500' : ''}
                                   />
                                   {errors.bankName && (
                                        <p className="text-xs text-red-600 mt-1">{errors.bankName}</p>
                                   )}
                              </div>

                              {/* Account Number */}
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Hash className="w-4 h-4 inline mr-1 text-purple-600" />
                                        Số tài khoản <span className="text-red-500">*</span>
                                   </label>
                                   <Input
                                        name="accountNumber"
                                        value={formData.accountNumber}
                                        onChange={handleInputChange}
                                        placeholder="Nhập số tài khoản (8-20 chữ số)"
                                        required
                                        className={errors.accountNumber ? 'border-red-500' : ''}
                                   />
                                   {errors.accountNumber && (
                                        <p className="text-xs text-red-600 mt-1">{errors.accountNumber}</p>
                                   )}
                                   <p className="text-xs text-gray-500 mt-1">Số tài khoản phải từ 8-20 chữ số</p>
                              </div>

                              {/* Account Holder */}
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <User className="w-4 h-4 inline mr-1 text-green-600" />
                                        Tên chủ tài khoản <span className="text-red-500">*</span>
                                   </label>
                                   <Input
                                        name="accountHolder"
                                        value={formData.accountHolder}
                                        onChange={handleInputChange}
                                        placeholder="Nhập tên chủ tài khoản"
                                        required
                                        className={errors.accountHolder ? 'border-red-500' : ''}
                                   />
                                   {errors.accountHolder && (
                                        <p className="text-xs text-red-600 mt-1">{errors.accountHolder}</p>
                                   )}
                              </div>

                              {/* Is Default */}
                              <div className="flex items-center space-x-2">
                                   <input
                                        type="checkbox"
                                        id="isDefault"
                                        checked={formData.isDefault}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                   />
                                   <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 flex items-center">
                                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                                        Đặt làm tài khoản mặc định
                                   </label>
                              </div>
                              {formData.isDefault && (
                                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                                        <p className="text-xs text-blue-800">
                                             Tài khoản này sẽ được đặt làm mặc định. Các tài khoản mặc định khác sẽ được bỏ đánh dấu tự động.
                                        </p>
                                   </div>
                              )}

                              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                   <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                             setShowModal(false);
                                             resetForm();
                                        }}
                                   >
                                        Hủy
                                   </Button>
                                   <Button type="submit" className="rounded-2xl">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {editingAccount ? "Cập nhật" : "Thêm tài khoản"}
                                   </Button>
                              </div>
                         </form>
                    </Modal>

                    {/* Demo Restricted Modal */}
                    <DemoRestrictedModal
                         isOpen={showDemoRestrictedModal}
                         onClose={() => setShowDemoRestrictedModal(false)}
                         featureName="Quản lý tài khoản ngân hàng"
                    />
               </div>
          </OwnerLayout>
     );
}

