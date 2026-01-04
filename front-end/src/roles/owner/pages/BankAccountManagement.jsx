import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { VIETNAM_BANKS, findVietnamBankByCode } from "../../../shared/constants/vietnamBanks";
import { useBankAccountData } from "./hooks";

export default function BankAccountManagement({ isDemo = false }) {
     const { user } = useAuth();
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);

     const currentUserId = useMemo(() => {
          return user?.userID || user?.UserID || user?.id || user?.userId || null;
     }, [user?.userID, user?.UserID, user?.id, user?.userId]);

     const {
          bankAccounts,
          loading,
          showModal,
          setShowModal,
          editingAccount,
          formData,
          errors,
          selectedBankMeta,
          handleInputChange,
          handleBankCodeChange,
          resetForm,
          handleCreateAccount,
          handleEditAccount,
          handleSubmit,
          handleDeleteAccount,
          handleSetDefault,
     } = useBankAccountData(currentUserId, isDemo);

     if (loading) {
          return (
               <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    <span className="ml-2 text-gray-600">Đang tải...</span>
               </div>
          );
     }

     return (
          <div className="space-y-6">
               {/* Header */}
               <div className="flex justify-between items-center">
                    <div>
                         <h1 className="text-3xl font-bold text-gray-900">Quản lý tài khoản ngân hàng</h1>
                         <p className="text-gray-600 mt-1">Thêm và quản lý tài khoản ngân hàng để nhận thanh toán</p>
                    </div>
                    <Button
                         onClick={() => handleCreateAccount(setShowDemoRestrictedModal)}
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
                         <Button onClick={() => handleCreateAccount(setShowDemoRestrictedModal)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Thêm tài khoản ngân hàng
                         </Button>
                    </Card>
               ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {bankAccounts.map((account) => {
                              const bankMeta = findVietnamBankByCode(account.bankShortCode || account.bankName);
                              return (
                                   <Card key={account.bankAccountId} className="overflow-hidden border border-purple-300 hover:shadow-2xl transition-all duration-300 rounded-2xl">
                                        <div className={`p-5 ${account.isDefault ? 'bg-gradient-to-br from-teal-50 to-blue-50' : 'bg-white'}`}>
                                             <div className="flex items-start gap-3 mb-3">
                                                  {bankMeta?.logo && (
                                                       <img
                                                            src={bankMeta.logo}
                                                            alt={account.bankName}
                                                            className="w-12 h-12 rounded-xl bg-white object-contain border border-teal-200 shadow-md"
                                                       />
                                                  )}
                                                  <div className="flex-1">
                                                       <div className="flex relative items-center space-x-2 w-full">
                                                            <Building2 className="w-5 h-5 text-teal-600" />
                                                            <h3 className="text-base font-bold text-gray-900">{account.bankName}</h3>
                                                            {account.isDefault && (
                                                                 <span className="px-2 py-1 absolute top-7 right-0 bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs font-medium rounded-full flex items-center">
                                                                      <Star className="w-3 h-3 mr-1 fill-current animate-pulse" />
                                                                      Mặc định
                                                                 </span>
                                                            )}
                                                       </div>
                                                       {(account.bankShortCode || bankMeta?.code) && (
                                                            <p className="text-xs flex items-center space-x-1 text-gray-700">
                                                                 Mã: {account.bankShortCode || bankMeta?.code}
                                                                 {bankMeta?.bin && <span className="text-xs text-gray-500"> - BIN: {bankMeta.bin}</span>}
                                                            </p>
                                                       )}
                                                  </div>
                                             </div>

                                             <div className="flex items-center justify-between mb-2 mx-auto space-x-2">
                                                  <div className="flex items-center space-x-2">
                                                       <Hash className="w-4 h-4 text-blue-600" />
                                                       <div>
                                                            <p className="text-xs text-gray-500">Số tài khoản</p>
                                                            <p className="text-sm font-semibold text-blue-600">{account.accountNumber}</p>
                                                       </div>
                                                  </div>
                                                  <div className="flex items-center space-x-2">
                                                       <User className="w-4 h-4 text-blue-600" />
                                                       <div>
                                                            <p className="text-xs text-gray-500">Chủ tài khoản</p>
                                                            <p className="text-sm font-medium text-blue-600">{account.accountHolder}</p>
                                                       </div>
                                                  </div>
                                             </div>

                                             <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                                                  {!account.isDefault && (
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleSetDefault(account, setShowDemoRestrictedModal)}
                                                            className="flex-1 text-xs border-teal-200 text-teal-600 hover:bg-teal-50 rounded-2xl hover:text-teal-700"
                                                       >
                                                            <Star className="w-3 h-3 mr-1" />
                                                            Đặt mặc định
                                                       </Button>
                                                  )}
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => handleEditAccount(account, setShowDemoRestrictedModal)}
                                                       className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 rounded-2xl"
                                                  >
                                                       <Edit className="w-3 h-3" />
                                                  </Button>
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => handleDeleteAccount(account, setShowDemoRestrictedModal)}
                                                       className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-2xl"
                                                  >
                                                       <Trash2 className="w-3 h-3" />
                                                  </Button>
                                             </div>
                                        </div>
                                   </Card>
                              );
                         })}
                    </div>
               )}

               {/* Add/Edit Modal */}
               <Modal
                    isOpen={showModal}
                    onClose={() => {
                         setShowModal(false);
                         resetForm();
                    }}
                    title={editingAccount ? "Chỉnh sửa tài khoản" : "Thêm tài khoản ngân hàng"}
                    className="max-w-lg"
               >
                    <form onSubmit={(e) => handleSubmit(e, setShowDemoRestrictedModal)} className="space-y-4">
                         {/* Bank Selection */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Ngân hàng <span className="text-red-500">*</span>
                              </label>
                              <Select value={formData.bankShortCode} onValueChange={handleBankCodeChange}>
                                   <SelectTrigger className={errors.bankShortCode ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Chọn ngân hàng" />
                                   </SelectTrigger>
                                   <SelectContent className="max-h-60">
                                        {VIETNAM_BANKS.map((bank) => (
                                             <SelectItem key={bank.code} value={bank.code}>
                                                  <div className="flex items-center gap-2">
                                                       {bank.logo && (
                                                            <img src={bank.logo} alt={bank.shortName} className="w-6 h-6 object-contain" />
                                                       )}
                                                       <span>{bank.shortName}</span>
                                                  </div>
                                             </SelectItem>
                                        ))}
                                   </SelectContent>
                              </Select>
                              {errors.bankShortCode && (
                                   <p className="text-red-500 text-xs mt-1">{errors.bankShortCode}</p>
                              )}
                         </div>

                         {/* Bank Name (auto-filled) */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Tên ngân hàng
                              </label>
                              <Input
                                   name="bankName"
                                   value={formData.bankName}
                                   onChange={handleInputChange}
                                   placeholder="Tên ngân hàng"
                                   disabled
                                   className="bg-gray-50"
                              />
                         </div>

                         {/* Account Number */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Số tài khoản <span className="text-red-500">*</span>
                              </label>
                              <Input
                                   name="accountNumber"
                                   value={formData.accountNumber}
                                   onChange={handleInputChange}
                                   placeholder="Nhập số tài khoản"
                                   className={errors.accountNumber ? "border-red-500" : ""}
                              />
                              {errors.accountNumber && (
                                   <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>
                              )}
                         </div>

                         {/* Account Holder */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Tên chủ tài khoản <span className="text-red-500">*</span>
                              </label>
                              <Input
                                   name="accountHolder"
                                   value={formData.accountHolder}
                                   onChange={handleInputChange}
                                   placeholder="Nhập tên chủ tài khoản"
                                   className={errors.accountHolder ? "border-red-500" : ""}
                              />
                              {errors.accountHolder && (
                                   <p className="text-red-500 text-xs mt-1">{errors.accountHolder}</p>
                              )}
                         </div>

                         {/* Selected Bank Info */}
                         {selectedBankMeta && (
                              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                   <div className="flex items-center gap-3">
                                        {selectedBankMeta.logo && (
                                             <img
                                                  src={selectedBankMeta.logo}
                                                  alt={selectedBankMeta.name}
                                                  className="w-10 h-10 object-contain"
                                             />
                                        )}
                                        <div>
                                             <p className="font-medium text-gray-900">{selectedBankMeta.name}</p>
                                             <p className="text-xs text-gray-500">
                                                  Mã: {selectedBankMeta.code} {selectedBankMeta.bin && `- BIN: ${selectedBankMeta.bin}`}
                                             </p>
                                        </div>
                                   </div>
                              </div>
                         )}

                         {/* Actions */}
                         <div className="flex justify-end gap-3 pt-4 border-t">
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
                              <Button type="submit">
                                   {editingAccount ? "Cập nhật" : "Thêm tài khoản"}
                              </Button>
                         </div>
                    </form>
               </Modal>

               {/* Demo Restricted Modal */}
               <DemoRestrictedModal
                    isOpen={showDemoRestrictedModal}
                    onClose={() => setShowDemoRestrictedModal(false)}
               />
          </div>
     );
}
