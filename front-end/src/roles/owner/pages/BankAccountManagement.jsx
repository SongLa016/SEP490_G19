import React, { useState, useEffect, useCallback } from "react";
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
import { fetchAllComplexesWithFields, updateField } from "../../../shared/services/fields";
import { VIETNAM_BANKS, findVietnamBankByCode } from "../../../shared/constants/vietnamBanks";

export default function BankAccountManagement({ isDemo = false }) {
     const { user } = useAuth();
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
     const selectedBankMeta = findVietnamBankByCode(formData.bankShortCode);
     // Tải danh sách tài khoản ngân hàng của owner
     const loadData = useCallback(async () => {
          try {
               setLoading(true);
               // lấy OwnerID từ user context
               const currentUserId = user?.userID || user?.UserID || user?.id || user?.userId;
               if (!isDemo && currentUserId) {
                    const accounts = await fetchOwnerBankAccounts(Number(currentUserId));
                    setBankAccounts(accounts || []);
               } else if (isDemo) {
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
     }, [isDemo, user?.UserID, user?.id, user?.userID, user?.userId]);

     useEffect(() => {
          loadData();
     }, [loadData]);

     //thay đổi form data
     const handleInputChange = (e) => {
          const { name, value } = e.target;
          setFormData(prev => ({
               ...prev,
               [name]: value
          }));
          if (errors[name]) {
               setErrors(prev => ({
                    ...prev,
                    [name]: ""
               }));
          }
     };

     // thay đổi ngân hàng
     const handleBankCodeChange = (code) => {
          const bank = findVietnamBankByCode(code);
          setFormData(prev => ({
               ...prev,
               bankShortCode: code,
               bankName: bank?.name || bank?.shortName || prev.bankName
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

     // tạo tài khoản mới
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
     // chỉnh sửa tài khoản
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
     // submit form
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

          // Kiểm tra trùng số tài khoản
          const normalizedAccountNumber = formData.accountNumber.replace(/\s/g, '');
          const duplicateAccount = bankAccounts.find(acc => {
               // Bỏ qua tài khoản đang edit
               if (editingAccount && acc.bankAccountId === editingAccount.bankAccountId) {
                    return false;
               }
               return acc.accountNumber === normalizedAccountNumber;
          });

          if (duplicateAccount) {
               Swal.fire({
                    icon: 'warning',
                    title: 'Số tài khoản đã tồn tại',
                    text: `Số tài khoản ${normalizedAccountNumber} đã được đăng ký với ngân hàng ${duplicateAccount.bankName}. Vui lòng sử dụng số tài khoản khác.`,
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#f59e0b'
               });
               return;
          }

          try {
               const currentUserId = user?.userID || user?.UserID || user?.id || user?.userId;
               const accountData = {
                    ownerId: Number(currentUserId),
                    bankName: formData.bankName,
                    bankShortCode: formData.bankShortCode,
                    accountNumber: normalizedAccountNumber,
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
     // xóa tài khoản
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
               Swal.fire({
                    title: 'Đang xóa...',
                    text: 'Vui lòng đợi trong giây lát',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                         Swal.showLoading();
                    }
               });

               try {
                    await deleteOwnerBankAccount(account.bankAccountId);
                    await Swal.fire({
                         icon: 'success',
                         title: 'Đã xóa!',
                         text: 'Tài khoản ngân hàng đã được xóa thành công.',
                         confirmButtonColor: '#10b981',
                         timer: 2000
                    });
                    loadData();
               } catch (error) {
                    let errorTitle = 'Không thể xóa tài khoản';
                    let errorText = error.message || 'Không thể xóa tài khoản ngân hàng. Vui lòng thử lại sau.';
                    let footer = '<small>Nếu vấn đề vẫn tiếp tục, vui lòng liên hệ hỗ trợ</small>';

                    if (error.message && (
                         error.message.includes('đang được sử dụng') ||
                         error.message.includes('sân') ||
                         error.message.includes('gỡ liên kết')
                    )) {
                         errorTitle = 'Tài khoản đang được sử dụng';
                         errorText = error.message;
                         footer = '<small>Vui lòng vào Quản lý sân để gỡ liên kết tài khoản khỏi các sân trước khi xóa</small>';
                    } else if (error.message && error.message.includes('401')) {
                         errorTitle = 'Phiên đăng nhập hết hạn';
                         errorText = 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.';
                    } else if (error.message && error.message.includes('403')) {
                         errorTitle = 'Không có quyền';
                         errorText = 'Bạn không có quyền thực hiện thao tác này.';
                    } else if (error.message && error.message.includes('404')) {
                         errorTitle = 'Không tìm thấy';
                         errorText = 'Tài khoản ngân hàng không tồn tại hoặc đã bị xóa.';
                    } else {
                         errorTitle = 'Không thể xóa tài khoản';
                    }

                    await Swal.fire({
                         icon: 'error',
                         title: errorTitle,
                         text: errorText,
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#ef4444',
                         footer: footer
                    });
               }
          }
     };
     // đặt tài khoản mặc định
     const handleSetDefault = async (account) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          try {
               const currentUserId = user?.userID || user?.UserID || user?.id || user?.userId;
               await setDefaultBankAccount(account.bankAccountId, Number(currentUserId));

               // Cập nhật BankAccountID cho tất cả fields của owner
               let updatedCount = 0;
               let failedCount = 0;
               try {
                    const allComplexesWithFields = await fetchAllComplexesWithFields();

                    // Lọc các complexes thuộc về owner này
                    const ownerComplexes = allComplexesWithFields.filter(
                         complex => {
                              const complexOwnerId = complex.ownerId || complex.OwnerID || complex.ownerID;
                              return complexOwnerId === currentUserId || complexOwnerId === Number(currentUserId);
                         }
                    );

                    // Lấy tất cả fields từ các complexes của owner
                    const allFields = [];
                    ownerComplexes.forEach(complex => {
                         if (complex.fields && Array.isArray(complex.fields)) {
                              allFields.push(...complex.fields);
                         }
                    });

                    // Cập nhật BankAccountID cho từng field
                    if (allFields.length > 0) {
                         const updateResults = await Promise.allSettled(
                              allFields.map(async (field) => {
                                   try {
                                        const fieldId = field.fieldId || field.FieldID || field.id;
                                        if (!fieldId) {
                                             console.warn(`⚠️ [UPDATE FIELD] Field missing ID:`, field);
                                             return { success: false, fieldId: null, error: "Missing fieldId", skipped: true };
                                        }

                                        // Kiểm tra các trường bắt buộc
                                        const complexId = field.complexId || field.ComplexID || field.complexID;
                                        const typeId = field.typeId || field.TypeID || field.typeID;
                                        const name = field.name || field.Name;

                                        if (!complexId || !typeId || !name) {
                                             return { success: false, fieldId, error: "Missing required fields", skipped: true };
                                        }

                                        // Sử dụng FormData thay vì JSON vì API yêu cầu multipart/form-data
                                        const formDataToSend = new FormData();
                                        formDataToSend.append("FieldId", String(fieldId));
                                        formDataToSend.append("ComplexId", String(complexId));
                                        formDataToSend.append("Name", name);
                                        formDataToSend.append("TypeId", String(typeId));
                                        formDataToSend.append("Size", field.size || field.Size || "");
                                        formDataToSend.append("GrassType", field.grassType || field.GrassType || "");
                                        formDataToSend.append("Description", field.description || field.Description || "");
                                        formDataToSend.append("PricePerHour", String(field.pricePerHour || field.PricePerHour || 0));
                                        formDataToSend.append("Status", field.status || field.Status || "Available");
                                        formDataToSend.append("BankAccountId", String(account.bankAccountId));
                                        formDataToSend.append("BankName", account.bankName || "");
                                        formDataToSend.append("BankShortCode", account.bankShortCode || "");
                                        formDataToSend.append("AccountNumber", account.accountNumber || "");
                                        formDataToSend.append("AccountHolder", account.accountHolder || "");

                                        // Giữ lại ảnh hiện có nếu có
                                        if (field.mainImageUrl || field.MainImageUrl) {
                                             formDataToSend.append("MainImageUrl", field.mainImageUrl || field.MainImageUrl);
                                        }
                                        const imageUrls = field.imageUrls || field.ImageUrls || [];
                                        if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                                             imageUrls.forEach(url => {
                                                  if (url) formDataToSend.append("ImageUrls", url);
                                             });
                                        }

                                        const result = await updateField(fieldId, formDataToSend);

                                        return { success: true, fieldId, result };
                                   } catch (error) {
                                        return { success: false, fieldId: field.fieldId || field.FieldID, error: error.message || String(error) };
                                   }
                              })
                         );

                         // Đếm số lượng thành công và thất bại
                         updateResults.forEach((result, index) => {
                              if (result.status === 'fulfilled' && result.value.success) {
                                   updatedCount++;
                              } else {
                                   failedCount++;
                                   const field = allFields[index];
                                   console.error(`❌ [UPDATE FIELD] Failed to update field ${field?.fieldId || field?.FieldID}:`,
                                        result.status === 'rejected' ? result.reason : result.value.error);
                              }
                         });

                    }
               } catch (error) {
                    console.error("❌ [UPDATE FIELDS] Error updating fields:", error);

               }

               // Hiển thị thông báo với số lượng fields đã cập nhật
               let message = `Tài khoản ${account.bankName} đã được đặt làm tài khoản mặc định.`;
               if (updatedCount > 0) {
                    message += `\nĐã cập nhật BankAccountID cho ${updatedCount} sân thành công.`;
               }
               if (failedCount > 0) {
                    message += `\nCó ${failedCount} sân cập nhật thất bại.`;
               }
               if (updatedCount === 0 && failedCount === 0) {
                    message += `\nKhông tìm thấy sân nào để cập nhật.`;
               }

               await Swal.fire({
                    icon: updatedCount > 0 ? 'success' : 'warning',
                    title: 'Đã đặt làm mặc định!',
                    text: message,
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
                         {bankAccounts.map((account) => {
                              const bankMeta = findVietnamBankByCode(account.bankShortCode || account.bankName);
                              return (
                                   <Card key={account.bankAccountId} className="overflow-hidden border border-purple-300 hover:shadow-2xl transition-all duration-300 rounded-2xl">
                                        <div className={`p-5 ${account.isDefault ? 'bg-gradient-to-br from-teal-50 to-blue-50 ' : 'bg-white'}`}>
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
                                                                 Mã: {account.bankShortCode || bankMeta?.code} {bankMeta?.bin && (
                                                                      <p className="text-xs text-gray-500"> - BIN: {bankMeta.bin}</p>
                                                                 )}
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
                                                            onClick={() => handleSetDefault(account)}
                                                            className="flex-1 text-xs border-teal-200 text-teal-600 hover:bg-teal-50 rounded-2xl hover:text-teal-700"
                                                       >
                                                            <Star className="w-3 h-3 mr-1" />
                                                            Đặt mặc định
                                                       </Button>
                                                  )}
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => handleEditAccount(account)}
                                                       className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 rounded-2xl"
                                                  >
                                                       <Edit className="w-4 h-4" />
                                                  </Button>
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => handleDeleteAccount(account)}
                                                       className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-2xl"
                                                  >
                                                       <Trash2 className="w-4 h-4" />
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
                                   <SelectTrigger className={`${errors.bankShortCode ? "border-red-500" : ""} h-auto rounded-2xl `}>
                                        {selectedBankMeta ? (
                                             <div className="flex items-center text-base font-medium">
                                                  {selectedBankMeta.logo && (
                                                       <img
                                                            src={selectedBankMeta.logo}
                                                            alt={selectedBankMeta.shortName}
                                                            className="w-10 h-10 object-contain"
                                                       />
                                                  )}
                                                  <div>
                                                       <p className="text-sm font-semibold text-gray-900">{selectedBankMeta.shortName}</p>
                                                       <p className="text-xs text-gray-500">{selectedBankMeta.code} · BIN {selectedBankMeta.bin}</p>
                                                  </div>
                                             </div>
                                        ) : (
                                             <SelectValue placeholder="Chọn ngân hàng" />
                                        )}
                                   </SelectTrigger>
                                   <SelectContent className="max-h-80 overflow-y-auto rounded-2xl">
                                        {VIETNAM_BANKS.map((bank) => (
                                             <SelectItem key={bank.code} value={bank.code}>
                                                  <div className="flex items-center gap-2">
                                                       {bank.logo && (
                                                            <img
                                                                 src={bank.logo}
                                                                 alt={bank.shortName}
                                                                 className="w-8 h-8 object-contain rounded-md border border-gray-100 bg-white"
                                                            />
                                                       )}
                                                       <div className="text-left">
                                                            <p className="text-sm font-medium text-gray-900">{bank.name}</p>
                                                            <p className="text-xs text-gray-500">{bank.shortName} · {bank.code}</p>
                                                       </div>
                                                  </div>
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
                                   disabled
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
                                   maxLength={20}
                                   className={errors.accountNumber ? 'border-red-500' : ''}
                              />
                              <div className="flex justify-between items-center mt-1">
                                   {errors.accountNumber ? (
                                        <p className="text-xs text-red-600">{errors.accountNumber}</p>
                                   ) : (
                                        <p className="text-xs text-gray-500">Số tài khoản phải từ 8-20 chữ số</p>
                                   )}
                                   <span className={`text-xs ${formData.accountNumber?.length >= 20 ? "text-red-500 font-medium" : formData.accountNumber?.length >= 18 ? "text-yellow-600" : "text-gray-400"}`}>
                                        {formData.accountNumber?.length || 0}/20
                                   </span>
                              </div>
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
                                   maxLength={100}
                                   className={errors.accountHolder ? 'border-red-500' : ''}
                              />
                              <div className="flex justify-between items-center mt-1">
                                   {errors.accountHolder && (
                                        <p className="text-xs text-red-600">{errors.accountHolder}</p>
                                   )}
                                   <span className={`text-xs ml-auto ${formData.accountHolder?.length >= 100 ? "text-red-500 font-medium" : formData.accountHolder?.length >= 90 ? "text-yellow-600" : "text-gray-400"}`}>
                                        {formData.accountHolder?.length || 0}/100
                                        {formData.accountHolder?.length >= 100 && " (đã đạt giới hạn)"}
                                   </span>
                              </div>
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
     );
}
