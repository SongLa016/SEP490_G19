import { useState, useEffect } from "react";
import { CreditCard, Plus, Edit3, Trash2, X, Building2, User, Hash, Eye, EyeOff, Star, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
     Card,
     CardContent,
     Button,
     Input,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
     Modal,
     FadeIn
} from "../../../../shared/components/ui";
import { bankingService } from "../../../../shared/services/bankingService";
import { fetchAllComplexesWithFields, updateField } from "../../../../shared/services/fields";
import ErrorDisplay from "../../../../shared/components/ErrorDisplay";
import { VIETNAM_BANKS, findVietnamBankByCode } from "../../../../shared/constants/vietnamBanks";
import Swal from "sweetalert2";

export default function BankingManagement({ user }) {
     const [bankAccounts, setBankAccounts] = useState([]);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState('');
     const [info, setInfo] = useState('');
     const [isDialogOpen, setIsDialogOpen] = useState(false);
     const [editingAccount, setEditingAccount] = useState(null);
     const [showAccountNumbers, setShowAccountNumbers] = useState({});

     const [formData, setFormData] = useState({
          bankName: '',
          bankShortCode: '',
          accountNumber: '',
          accountHolder: '',
          isDefault: false
     });
     const [errors, setErrors] = useState({});
     const selectedBankMeta = findVietnamBankByCode(formData.bankShortCode);

     useEffect(() => {
          if (user?.userID) {
               loadBankAccounts();
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [user?.userID]);
     const loadBankAccounts = async () => {
          setIsLoading(true);
          try {
               const result = await bankingService.getBankAccounts(user.userID);
               if (result.ok) {
                    setBankAccounts(result.accounts);
               } else {
                    setError(result.reason);
               }
          } catch (error) {
               setError('Có lỗi xảy ra khi tải danh sách tài khoản ngân hàng');
          } finally {
               setIsLoading(false);
          }
     };

     const handleInputChange = (field, value) => {
          setFormData(prev => ({
               ...prev,
               [field]: value
          }));
          // Clear error when user starts typing
          if (errors[field]) {
               setErrors(prev => ({
                    ...prev,
                    [field]: ""
               }));
          }
     };

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

     const handleSubmit = async () => {
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
          const currentAccountId = editingAccount?.bankAccountId || editingAccount?.accountID;
          const duplicateAccount = bankAccounts.find(acc => {
               const accId = acc.bankAccountId || acc.accountID;
               // Bỏ qua tài khoản đang edit
               if (editingAccount && accId === currentAccountId) {
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

          setIsLoading(true);
          setError('');
          setInfo('');

          try {
               const accountData = {
                    userID: user.userID,
                    bankName: formData.bankName,
                    bankShortCode: formData.bankShortCode,
                    accountNumber: normalizedAccountNumber,
                    accountHolder: formData.accountHolder,
                    isDefault: formData.isDefault
               };

               let result;
               const accountId = editingAccount?.bankAccountId || editingAccount?.accountID;
               if (editingAccount && accountId) {
                    result = await bankingService.updateBankAccount(accountId, accountData);
               } else {
                    result = await bankingService.createBankAccount(accountData);
               }

               if (result.ok) {
                    await Swal.fire({
                         icon: 'success',
                         title: editingAccount ? 'Cập nhật thành công!' : 'Tạo thành công!',
                         text: result.message || (editingAccount ? 'Thông tin tài khoản ngân hàng đã được cập nhật.' : 'Tài khoản ngân hàng đã được thêm.'),
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#10b981'
                    });
                    setIsDialogOpen(false);
                    resetForm();
                    loadBankAccounts();
               } else {
                    setError(result.reason);
               }
          } catch (error) {
               setError('Có lỗi xảy ra khi lưu thông tin tài khoản ngân hàng');
          } finally {
               setIsLoading(false);
          }
     };

     const handleEdit = (account) => {
          setEditingAccount(account);
          setFormData({
               bankName: account.bankName,
               bankShortCode: account.bankShortCode || '',
               accountNumber: account.accountNumber,
               accountHolder: account.accountHolder || account.accountHolderName,
               isDefault: account.isDefault || false
          });
          setErrors({});
          setIsDialogOpen(true);
     };

     const handleDelete = async (account) => {
          const accountId = account.bankAccountId || account.accountID;
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
               setIsLoading(true);
               try {
                    const deleteResult = await bankingService.deleteBankAccount(accountId);
                    if (deleteResult.ok) {
                         await Swal.fire({
                              icon: 'success',
                              title: 'Đã xóa!',
                              text: 'Tài khoản ngân hàng đã được xóa.',
                              confirmButtonColor: '#10b981',
                              timer: 2000
                         });
                         loadBankAccounts();
                    } else {
                         setError(deleteResult.reason);
                    }
               } catch (error) {
                    setError('Có lỗi xảy ra khi xóa tài khoản ngân hàng');
               } finally {
                    setIsLoading(false);
               }
          }
     };

     const handleSetDefault = async (account) => {
          const accountId = account.bankAccountId || account.accountID;
          const currentUserId = user?.userID || user?.UserID || user?.id || user?.userId;
          setIsLoading(true);
          try {
               const result = await bankingService.setDefaultBankAccount(accountId, currentUserId);
               if (result.ok) {
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
                                             if (!fieldId) return { success: false, skipped: true };

                                             // Kiểm tra các trường bắt buộc
                                             const complexId = field.complexId || field.ComplexID;
                                             const typeId = field.typeId || field.TypeID;
                                             const name = field.name || field.Name;

                                             if (!complexId || !typeId || !name) {
                                                  console.warn(`Field ${fieldId} missing required fields. Skipping.`);
                                                  return { success: false, skipped: true };
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

                                             await updateField(fieldId, formDataToSend);
                                             return { success: true };
                                        } catch (err) {
                                             console.error('Error updating field:', err);
                                             return { success: false };
                                        }
                                   })
                              );

                              // Đếm số sân thực sự được cập nhật (không tính các sân bị skip)
                              const validResults = updateResults.filter(r => r.status === 'fulfilled' && !r.value?.skipped);
                              updatedCount = validResults.filter(r => r.value?.success).length;
                              failedCount = validResults.filter(r => !r.value?.success).length;
                         }
                    } catch (err) {
                         console.error('Error updating fields with new bank account:', err);
                    }

                    let successMessage = `Tài khoản ${account.bankName} đã được đặt làm tài khoản mặc định.`;
                    if (updatedCount > 0) {
                         successMessage += ` Đã cập nhật ${updatedCount} sân.`;
                    }
                    if (failedCount > 0) {
                         successMessage += ` (${failedCount} sân không cập nhật được)`;
                    }

                    await Swal.fire({
                         icon: 'success',
                         title: 'Đã đặt làm mặc định!',
                         text: successMessage,
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#10b981'
                    });
                    loadBankAccounts();
               } else {
                    setError(result.reason);
               }
          } catch (error) {
               setError('Có lỗi xảy ra khi đặt tài khoản mặc định');
          } finally {
               setIsLoading(false);
          }
     };

     const resetForm = () => {
          setFormData({
               bankName: '',
               bankShortCode: '',
               accountNumber: '',
               accountHolder: '',
               isDefault: false
          });
          setErrors({});
          setEditingAccount(null);
     };

     const toggleAccountNumberVisibility = (accountId) => {
          setShowAccountNumbers(prev => ({
               ...prev,
               [accountId]: !prev[accountId]
          }));
     };

     const maskAccountNumber = (accountNumber) => {
          if (!accountNumber) return '';
          const length = accountNumber.length;
          if (length <= 4) return accountNumber;
          return accountNumber.substring(0, 4) + '*'.repeat(length - 8) + accountNumber.substring(length - 4);
     };
     return (
          <div className="space-y-2 border border-teal-200 bg-white shadow-lg rounded-3xl">
               {/* Header Section */}
               <div className="flex flex-col sm:flex-row sm:items-center p-3 sm:justify-between">
                    <div className="flex-1">
                         <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                              <div className=" bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-md">
                                   <CreditCard className="w-6 h-6 text-white" />
                              </div>
                              Tài khoản ngân hàng
                         </h1>
                         <p className="text-gray-600 ml-14 text-sm">
                              Quản lý và thêm tài khoản ngân hàng để thuận tiện trong việc thanh toán
                         </p>
                    </div>
                    <Button
                         onClick={() => {
                              resetForm();
                              setEditingAccount(null);
                              setIsDialogOpen(true);
                         }}
                         className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1 px-3 py-1 whitespace-nowrap"
                         size="sm"
                    >
                         <Plus className="w-5 h-5" />
                         <span className="font-semibold">Thêm tài khoản</span>
                    </Button>
               </div>

               {/* Error and Info Messages */}
               {error && (
                    <div className="mb-4">
                         <ErrorDisplay
                              type="error"
                              title="Lỗi"
                              message={error}
                              onClose={() => setError('')}
                         />
                    </div>
               )}
               {info && (
                    <div className="mb-4">
                         <ErrorDisplay
                              type="success"
                              title="Thành công"
                              message={info}
                              onClose={() => setInfo('')}
                         />
                    </div>
               )}

               {/* Content Section */}
               <Card className="">
                    <CardContent className="p-3">
                         {isLoading && !bankAccounts.length ? (
                              <div className="flex flex-col items-center justify-center py-10">
                                   <div className="relative">
                                        <Loader2 className="w-16 h-16 animate-spin text-teal-600" />
                                        <div className="absolute inset-0 w-16 h-16 border-4 border-teal-100 rounded-full"></div>
                                   </div>
                                   <p className="text-gray-600 font-medium mt-6">Đang tải danh sách tài khoản...</p>
                              </div>
                         ) : bankAccounts.length === 0 ? (
                              <div className="text-center py-10">
                                   <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-teal-50 to-blue-50 mb-6 shadow-inner">
                                        <CreditCard className="w-14 h-14 text-teal-500" />
                                   </div>
                                   <h3 className="text-2xl font-bold text-gray-900 mb-3">Chưa có tài khoản ngân hàng</h3>
                                   <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                                        Thêm tài khoản ngân hàng để thuận tiện trong việc thanh toán và quản lý giao dịch
                                   </p>
                                   <Button
                                        onClick={() => {
                                             resetForm();
                                             setEditingAccount(null);
                                             setIsDialogOpen(true);
                                        }}
                                        className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                                        size="lg"
                                   >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Thêm tài khoản ngân hàng đầu tiên
                                   </Button>
                              </div>
                         ) : (
                              <div className="grid grid-cols-2 gap-3">
                                   {bankAccounts.map((account, index) => {
                                        const accountId = account.bankAccountId || account.accountID;
                                        const bankMeta = findVietnamBankByCode(account.bankShortCode || account.bankName);
                                        return (
                                             <FadeIn key={accountId} delay={index * 100}>
                                                  <Card className="overflow-hidden border border-teal-200 hover:border-teal-300 hover:shadow-xl transition-all duration-300 rounded-2xl group bg-white">
                                                       <div className={`p-3 ${account.isDefault ? 'bg-gradient-to-br from-teal-50 via-blue-100 to-teal-50' : 'bg-white'}`}>
                                                            {/* Bank Header */}
                                                            <div className="flex items-start gap-2 mb-2">
                                                                 {bankMeta?.logo ? (
                                                                      <div className="flex-shrink-0">
                                                                           <div className="w-10 h-10 rounded-xl bg-white border border-teal-200 p-2 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                                                                                <img
                                                                                     src={bankMeta.logo}
                                                                                     alt={account.bankName}
                                                                                     className="w-full h-full object-contain"
                                                                                />
                                                                           </div>
                                                                      </div>
                                                                 ) : (
                                                                      <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 border border-purple-300 shadow-sm">
                                                                           <Building2 className="w-7 h-7 text-purple-600" />
                                                                      </div>
                                                                 )}
                                                                 <div className="flex-1 min-w-0">
                                                                      <div className="flex items-start justify-between gap-2">
                                                                           <h3 className="text-base font-bold text-gray-900 truncate">
                                                                                {account.bankName}
                                                                           </h3>
                                                                           {account.isDefault && (
                                                                                <span className="flex-shrink-0 px-2.5 py-1 bg-white text-yellow-500 border border-yellow-200 text-xs font-medium rounded-full flex items-center gap-1 shadow-sm">
                                                                                     <Star className="w-3 h-3 fill-current animate-pulse" />
                                                                                     Mặc định
                                                                                </span>
                                                                           )}
                                                                      </div>
                                                                      {(account.bankShortCode || bankMeta?.code) && (
                                                                           <p className="text-xs text-teal-600 flex items-center gap-1">
                                                                                <span className="font-medium">Mã:</span>
                                                                                <span className="px-2 py-0.5 bg-teal-100 rounded font-mono text-teal-700">
                                                                                     {account.bankShortCode || bankMeta?.code}
                                                                                </span>
                                                                                {bankMeta?.bin && (
                                                                                     <span className="text-teal-500">BIN {bankMeta.bin}</span>
                                                                                )}
                                                                           </p>
                                                                      )}
                                                                 </div>
                                                            </div>

                                                            {/* Account Details */}
                                                            <div className="space-y-2 mb-2">
                                                                 <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-2xl border border-blue-200">
                                                                      <div className="flex-shrink-0 p-1 bg-blue-100 rounded-2xl">
                                                                           <Hash className="w-5 h-5 text-blue-600" />
                                                                      </div>
                                                                      <div className="flex-1 min-w-0">
                                                                           <p className="text-xs text-blue-600 font-medium mb-1">Số tài khoản</p>
                                                                           <div className="flex items-center gap-2">
                                                                                <p className="text-sm font-bold text-gray-900 font-mono">
                                                                                     {showAccountNumbers[accountId]
                                                                                          ? account.accountNumber
                                                                                          : maskAccountNumber(account.accountNumber)
                                                                                     }
                                                                                </p>
                                                                                <Button
                                                                                     variant="ghost"
                                                                                     size="sm"
                                                                                     onClick={() => toggleAccountNumberVisibility(accountId)}
                                                                                     className="h-5 w-5 p-0 text-blue-400 hover:text-blue-600 hover:bg-blue-200 rounded"
                                                                                     title={showAccountNumbers[accountId] ? "Ẩn số tài khoản" : "Hiện số tài khoản"}
                                                                                >
                                                                                     {showAccountNumbers[accountId] ? (
                                                                                          <EyeOff className="w-4 h-4" />
                                                                                     ) : (
                                                                                          <Eye className="w-4 h-4" />
                                                                                     )}
                                                                                </Button>
                                                                           </div>
                                                                      </div>
                                                                 </div>
                                                                 <div className="flex items-center gap-3 p-2 bg-green-50 rounded-2xl border border-green-200">
                                                                      <div className="flex-shrink-0 p-1 bg-green-100 rounded-2xl">
                                                                           <User className="w-4 h-4 text-green-600" />
                                                                      </div>
                                                                      <div className="flex-1 min-w-0">
                                                                           <p className="text-xs text-green-600 font-medium mb-1">Chủ tài khoản</p>
                                                                           <p className="text-sm font-semibold text-green-900 truncate">
                                                                                {account.accountHolder || account.accountHolderName}
                                                                           </p>
                                                                      </div>
                                                                 </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex items-center gap-2 pt-2 border-t border-teal-200">
                                                                 {!account.isDefault && (
                                                                      <Button
                                                                           variant="outline"
                                                                           size="sm"
                                                                           onClick={() => handleSetDefault(account)}
                                                                           className="flex-1 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400 rounded-2xl font-medium transition-all duration-200"
                                                                      >
                                                                           <Star className="w-4 h-4 mr-1" />
                                                                           Đặt mặc định
                                                                      </Button>
                                                                 )}
                                                                 <Button
                                                                      variant="outline"
                                                                      size="sm"
                                                                      onClick={() => handleEdit(account)}
                                                                      className="text-blue-600 px-2 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300 rounded-2xl transition-all duration-200"
                                                                      title="Chỉnh sửa"
                                                                 >
                                                                      <Edit3 className="w-4 h-4" />
                                                                 </Button>
                                                                 <Button
                                                                      variant="outline"
                                                                      size="sm"
                                                                      onClick={() => handleDelete(account)}
                                                                      className="text-red-600 px-2 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 rounded-2xl transition-all duration-200"
                                                                      title="Xóa"
                                                                 >
                                                                      <Trash2 className="w-4 h-4" />
                                                                 </Button>
                                                            </div>
                                                       </div>
                                                  </Card>
                                             </FadeIn>
                                        );
                                   })}
                              </div>
                         )}
                    </CardContent>
               </Card>

               {/* Add/Edit Modal */}
               <Modal
                    isOpen={isDialogOpen}
                    onClose={() => {
                         setIsDialogOpen(false);
                         resetForm();
                    }}
                    title={
                         <div className="flex items-center gap-3">
                              <div className="p-2 bg-teal-100 rounded-xl">
                                   <CreditCard className="w-5 h-5 text-teal-600" />
                              </div>
                              <span className="text-xl font-bold text-gray-900">
                                   {editingAccount ? 'Chỉnh sửa tài khoản ngân hàng' : 'Thêm tài khoản ngân hàng mới'}
                              </span>
                         </div>
                    }
                    className="max-w-2xl rounded-2xl shadow-2xl px-6 max-h-[90vh] overflow-y-auto scrollbar-hide"
               >
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3 py-1">
                         {/* Bank Short Code */}
                         <div className="space-y-2">
                              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                   <Building2 className="w-4 h-4 text-teal-600" />
                                   Ngân hàng <span className="text-red-500">*</span>
                              </label>
                              <Select
                                   value={formData.bankShortCode}
                                   onValueChange={handleBankCodeChange}
                              >
                                   <SelectTrigger className={`${errors.bankShortCode ? "border-red-500 ring-red-200" : "border-teal-200 focus:border-teal-500 focus:ring-teal-200"} h-auto py-1 rounded-xl transition-all duration-200`}>
                                        {selectedBankMeta ? (
                                             <div className="flex items-center gap-3 w-full">
                                                  {selectedBankMeta.logo && (
                                                       <img
                                                            src={selectedBankMeta.logo}
                                                            alt={selectedBankMeta.shortName}
                                                            className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white"
                                                       />
                                                  )}
                                                  <div className="flex-1 text-left">
                                                       <p className="text-sm font-bold text-gray-900">{selectedBankMeta.shortName}</p>
                                                       <p className="text-xs text-gray-500">{selectedBankMeta.code} · BIN {selectedBankMeta.bin}</p>
                                                  </div>
                                             </div>
                                        ) : (
                                             <SelectValue placeholder="Chọn ngân hàng" className="text-gray-400" />
                                        )}
                                   </SelectTrigger>
                                   <SelectContent className="max-h-80 overflow-y-auto rounded-xl border-2 border-teal-100">
                                        {VIETNAM_BANKS.map((bank) => (
                                             <SelectItem key={bank.code} value={bank.code} className="py-3">
                                                  <div className="flex items-center gap-3">
                                                       {bank.logo && (
                                                            <img
                                                                 src={bank.logo}
                                                                 alt={bank.shortName}
                                                                 className="w-10 h-10 object-contain rounded-lg border border-gray-100 bg-white p-1"
                                                            />
                                                       )}
                                                       <div className="text-left">
                                                            <p className="text-sm font-semibold text-gray-900">{bank.name}</p>
                                                            <p className="text-xs text-gray-500">{bank.shortName} · {bank.code}</p>
                                                       </div>
                                                  </div>
                                             </SelectItem>
                                        ))}
                                   </SelectContent>
                              </Select>
                              {errors.bankShortCode && (
                                   <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.bankShortCode}
                                   </p>
                              )}
                         </div>

                         {/* Bank Name (auto-filled but editable) */}
                         <div className="space-y-2">
                              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                   Tên ngân hàng <span className="text-red-500">*</span>
                              </label>
                              <Input
                                   name="bankName"
                                   value={formData.bankName}
                                   onChange={(e) => handleInputChange('bankName', e.target.value)}
                                   placeholder="Tên ngân hàng sẽ được điền tự động"
                                   required
                                   disabled
                                   className={`${errors.bankName ? 'border-red-500 ring-red-200' : 'border-teal-200'} rounded-xl py-3 bg-gray-50`}
                              />
                              {errors.bankName && (
                                   <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.bankName}
                                   </p>
                              )}
                         </div>

                         {/* Account Number */}
                         <div className="space-y-2">
                              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                   <Hash className="w-4 h-4 text-purple-600" />
                                   Số tài khoản <span className="text-red-500">*</span>
                              </label>
                              <Input
                                   name="accountNumber"
                                   value={formData.accountNumber}
                                   onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                                   placeholder="Nhập số tài khoản (8-20 chữ số)"
                                   required
                                   className={`${errors.accountNumber ? 'border-red-500 ring-red-200' : 'border-teal-200 focus:border-teal-500 focus:ring-teal-200'} rounded-xl py-3 transition-all duration-200`}
                              />
                              {errors.accountNumber && (
                                   <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.accountNumber}
                                   </p>
                              )}
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                   <AlertCircle className="w-3 h-3" />
                                   Số tài khoản phải từ 8-20 chữ số
                              </p>
                         </div>

                         {/* Account Holder */}
                         <div className="space-y-2">
                              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                   <User className="w-4 h-4 text-green-600" />
                                   Tên chủ tài khoản <span className="text-red-500">*</span>
                              </label>
                              <Input
                                   name="accountHolder"
                                   value={formData.accountHolder}
                                   onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                                   placeholder="Nhập tên chủ tài khoản (chính xác như trên thẻ)"
                                   required
                                   className={`${errors.accountHolder ? 'border-red-500 ring-red-200' : 'border-teal-200 focus:border-teal-500 focus:ring-teal-200'} rounded-xl py-3 transition-all duration-200`}
                              />
                              {errors.accountHolder && (
                                   <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.accountHolder}
                                   </p>
                              )}
                         </div>

                         {/* Is Default */}
                         <div className="space-y-2">
                              <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-blue-50 to-blue-300 rounded-xl border-2 border-blue-200">
                                   <input
                                        type="checkbox"
                                        id="isDefault"
                                        checked={formData.isDefault}
                                        onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 focus:ring-2 cursor-pointer"
                                   />
                                   <label htmlFor="isDefault" className="text-sm font-semibold text-gray-700 flex items-center gap-2 cursor-pointer flex-1">
                                        <Star className="w-4 h-4 text-blue-500 fill-current" />
                                        <span>Đặt làm tài khoản mặc định</span>
                                   </label>
                              </div>
                              {formData.isDefault && (
                                   <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-yellow-800 leading-relaxed">
                                             <strong className="font-bold">Lưu ý:</strong> Tài khoản này sẽ được đặt làm mặc định. Các tài khoản mặc định khác sẽ được bỏ đánh dấu tự động.
                                        </p>
                                   </div>
                              )}
                         </div>

                         {/* Form Actions */}
                         <div className="flex justify-end gap-2 pt-2 border-t-2 border-gray-100">
                              <Button
                                   type="button"
                                   variant="outline"
                                   onClick={() => {
                                        setIsDialogOpen(false);
                                        resetForm();
                                   }}
                                   className="rounded-xl px-4 py-1 items-center border-gray-300 hover:bg-gray-50 transition-all duration-200"
                                   disabled={isLoading}
                              >
                                   <X className="w-4 h-4 mr-2" />
                                   Hủy
                              </Button>
                              <Button
                                   type="submit"
                                   disabled={isLoading}
                                   className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                              >
                                   {isLoading ? (
                                        <>
                                             <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                             Đang lưu...
                                        </>
                                   ) : (
                                        <>
                                             <CheckCircle className="w-5 h-5 mr-2" />
                                             <span className="font-semibold">{editingAccount ? "Cập nhật" : "Thêm tài khoản"}</span>
                                        </>
                                   )}
                              </Button>
                         </div>
                    </form>
               </Modal>
          </div>
     );
}