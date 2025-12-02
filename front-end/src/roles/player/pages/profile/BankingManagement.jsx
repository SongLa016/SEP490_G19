import { useState, useEffect } from "react";
import { CreditCard, Plus, Edit3, Trash2, Save, X, Building2, User, Hash, Eye, EyeOff, Star } from "lucide-react";
import {
     Card,
     CardContent,
     CardHeader,
     CardTitle,
     Button,
     Input,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
     Modal,
     LoadingSpinner,
     FadeIn,
     SlideIn
} from "../../../../shared/components/ui";
import { bankingService } from "../../../../shared/services/bankingService";
import ErrorDisplay from "../../../../shared/components/ErrorDisplay";

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
          accountNumber: '',
          accountHolderName: '',
          branchName: '',
          isDefault: false
     });

     const vietnameseBanks = [
          'Vietcombank', 'VietinBank', 'BIDV', 'Agribank', 'Techcombank',
          'MB Bank', 'ACB', 'VPBank', 'TPBank', 'Sacombank',
          'HDBank', 'VIB', 'SHB', 'OCB', 'LienVietPostBank',
          'SeABank', 'ABBANK', 'NCB', 'Kienlongbank', 'PGBank'
     ];

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
     };

     const handleSubmit = async () => {
          if (!formData.bankName || !formData.accountNumber || !formData.accountHolderName) {
               setError('Vui lòng điền đầy đủ thông tin bắt buộc');
               return;
          }

          setIsLoading(true);
          setError('');
          setInfo('');

          try {
               const accountData = {
                    ...formData,
                    userID: user.userID
               };

               let result;
               if (editingAccount) {
                    result = await bankingService.updateBankAccount(editingAccount.accountID, accountData);
               } else {
                    result = await bankingService.createBankAccount(accountData);
               }

               if (result.ok) {
                    setInfo(result.message);
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
               accountNumber: account.accountNumber,
               accountHolderName: account.accountHolder || account.accountHolderName, // Handle both field names
               branchName: account.branchName || '',
               isDefault: account.isDefault || false
          });
          setIsDialogOpen(true);
     };

     const handleDelete = async (accountID) => {
          if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản ngân hàng này?')) {
               return;
          }

          setIsLoading(true);
          try {
               const result = await bankingService.deleteBankAccount(accountID);
               if (result.ok) {
                    setInfo(result.message);
                    loadBankAccounts();
               } else {
                    setError(result.reason);
               }
          } catch (error) {
               setError('Có lỗi xảy ra khi xóa tài khoản ngân hàng');
          } finally {
               setIsLoading(false);
          }
     };

     const handleSetDefault = async (accountID) => {
          setIsLoading(true);
          try {
               const result = await bankingService.setDefaultBankAccount(accountID, user.userID);
               if (result.ok) {
                    setInfo(result.message);
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
               accountNumber: '',
               accountHolderName: '',
               branchName: '',
               isDefault: false
          });
          setEditingAccount(null);
     };

     const toggleAccountNumberVisibility = (accountID) => {
          setShowAccountNumbers(prev => ({
               ...prev,
               [accountID]: !prev[accountID]
          }));
     };

     const maskAccountNumber = (accountNumber) => {
          if (!accountNumber) return '';
          const length = accountNumber.length;
          if (length <= 4) return accountNumber;
          return accountNumber.substring(0, 4) + '*'.repeat(length - 8) + accountNumber.substring(length - 4);
     };
     return (
          <SlideIn direction="right" delay={400}>
               <Card className="border border-teal-200/80 bg-white/95 shadow-xl backdrop-blur rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    <CardHeader className="border-b border-teal-100/70 bg-gradient-to-r from-teal-50 via-white to-white py-4 px-6 rounded-t-3xl">
                         <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center text-teal-900">
                                   <div className="p-2 bg-teal-200 rounded-xl mr-3">
                                        <CreditCard className="w-5 h-5 text-teal-700" />
                                   </div>
                                   Tài khoản ngân hàng
                              </CardTitle>
                              <Button
                                   onClick={() => {
                                        resetForm();
                                        setIsDialogOpen(true);
                                   }}
                                   className="bg-teal-500 hover:bg-teal-600 rounded-xl shadow-sm"
                                   size="sm"
                              >
                                   <Plus className="w-4 h-4 mr-2" />
                                   Thêm tài khoản
                              </Button>

                              <Modal
                                   isOpen={isDialogOpen}
                                   onClose={() => setIsDialogOpen(false)}
                                   title={editingAccount ? 'Chỉnh sửa tài khoản ngân hàng' : 'Thêm tài khoản ngân hàng'}
                                   className="sm:max-w-md"
                              >
                                   <div className="space-y-4">
                                        <div>
                                             <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                  Ngân hàng *
                                             </label>
                                             <Select
                                                  value={formData.bankName}
                                                  onValueChange={(value) => handleInputChange('bankName', value)}
                                             >
                                                  <SelectTrigger className="rounded-xl border-teal-200 focus:border-teal-500">
                                                       <SelectValue placeholder="Chọn ngân hàng" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       {vietnameseBanks.map((bank) => (
                                                            <SelectItem key={bank} value={bank}>
                                                                 {bank}
                                                            </SelectItem>
                                                       ))}
                                                  </SelectContent>
                                             </Select>
                                        </div>
                                        <div>
                                             <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                  Số tài khoản *
                                             </label>
                                             <Input
                                                  value={formData.accountNumber}
                                                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                                                  placeholder="Nhập số tài khoản"
                                                  className="rounded-xl border-teal-200 focus:border-teal-500"
                                             />
                                        </div>
                                        <div>
                                             <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                  Tên chủ tài khoản *
                                             </label>
                                             <Input
                                                  value={formData.accountHolderName}
                                                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                                                  placeholder="Nhập tên chủ tài khoản"
                                                  className="rounded-xl border-teal-200 focus:border-teal-500"
                                             />
                                        </div>
                                        <div>
                                             <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                  Chi nhánh
                                             </label>
                                             <Input
                                                  value={formData.branchName}
                                                  onChange={(e) => handleInputChange('branchName', e.target.value)}
                                                  placeholder="Nhập tên chi nhánh"
                                                  className="rounded-xl border-teal-200 focus:border-teal-500"
                                             />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                             <input
                                                  type="checkbox"
                                                  id="isDefault"
                                                  checked={formData.isDefault}
                                                  onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                                                  className="rounded border-teal-300 text-teal-600 focus:ring-teal-500"
                                             />
                                             <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                                                  Đặt làm tài khoản mặc định
                                             </label>
                                        </div>
                                        <div className="flex gap-2 pt-4">
                                             <Button
                                                  variant="outline"
                                                  onClick={() => setIsDialogOpen(false)}
                                                  className="flex-1 rounded-xl"
                                             >
                                                  <X className="w-4 h-4 mr-2" />
                                                  Hủy
                                             </Button>
                                             <Button
                                                  onClick={handleSubmit}
                                                  disabled={isLoading}
                                                  className="flex-1 bg-teal-500 hover:bg-teal-600 rounded-xl"
                                             >
                                                  {isLoading ? (
                                                       <>
                                                            <LoadingSpinner size="sm" className="mr-2" />
                                                            Đang lưu...
                                                       </>
                                                  ) : (
                                                       <>
                                                            <Save className="w-4 h-4 mr-2" />
                                                            Lưu
                                                       </>
                                                  )}
                                             </Button>
                                        </div>
                                   </div>
                              </Modal>
                         </div>
                    </CardHeader>
                    <CardContent className="p-6">
                         {/* Error and Info Messages */}
                         {error && (
                              <ErrorDisplay
                                   type="error"
                                   title="Lỗi"
                                   message={error}
                                   onClose={() => setError('')}
                                   className="mb-4"
                              />
                         )}
                         {info && (
                              <ErrorDisplay
                                   type="success"
                                   title="Thành công"
                                   message={info}
                                   onClose={() => setInfo('')}
                                   className="mb-4"
                              />
                         )}

                         {isLoading && !bankAccounts.length ? (
                              <div className="flex items-center justify-center py-8">
                                   <LoadingSpinner size="lg" />
                                   <span className="ml-2 text-teal-600">Đang tải...</span>
                              </div>
                         ) : bankAccounts.length === 0 ? (
                              <div className="text-center py-8">
                                   <CreditCard className="w-16 h-16 text-teal-300 mx-auto mb-4" />
                                   <p className="text-teal-600 text-lg font-medium mb-2">Chưa có tài khoản ngân hàng</p>
                                   <p className="text-teal-500 text-sm">Thêm tài khoản ngân hàng để thuận tiện trong việc thanh toán</p>
                              </div>
                         ) : (
                              <div className="space-y-4">
                                   {bankAccounts.map((account, index) => (
                                        <FadeIn key={account.accountID} delay={index * 100}>
                                             <div className="rounded-2xl border border-teal-100 bg-white/80 p-4 shadow-sm">
                                                  <div className="flex items-start justify-between">
                                                       <div className="flex items-start gap-3 flex-1">
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                                                 <Building2 className="w-6 h-6" />
                                                            </div>
                                                            <div className="flex-1 space-y-2">
                                                                 <div className="flex items-center gap-2">
                                                                      <h3 className="text-lg font-semibold text-teal-900">
                                                                           {account.bankName}
                                                                      </h3>
                                                                      {account.isDefault && (
                                                                           <span className="text-xs text-white bg-teal-500 px-2 py-1 rounded-lg font-medium">
                                                                                Mặc định
                                                                           </span>
                                                                      )}
                                                                      {account.branchName && (
                                                                           <span className="text-sm text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                                                                                {account.branchName}
                                                                           </span>
                                                                      )}
                                                                 </div>
                                                                 <div className="space-y-1">
                                                                      <div className="flex items-center gap-2">
                                                                           <Hash className="w-4 h-4 text-teal-500" />
                                                                           <span className="text-sm text-teal-500 font-medium">Số tài khoản:</span>
                                                                           <span className="text-base font-mono text-teal-900">
                                                                                {showAccountNumbers[account.accountID]
                                                                                     ? account.accountNumber
                                                                                     : maskAccountNumber(account.accountNumber)
                                                                                }
                                                                           </span>
                                                                           <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => toggleAccountNumberVisibility(account.accountID)}
                                                                                className="h-6 w-6 p-0 text-teal-500 hover:text-teal-700"
                                                                           >
                                                                                {showAccountNumbers[account.accountID] ? (
                                                                                     <EyeOff className="w-4 h-4" />
                                                                                ) : (
                                                                                     <Eye className="w-4 h-4" />
                                                                                )}
                                                                           </Button>
                                                                      </div>
                                                                      <div className="flex items-center gap-2">
                                                                           <User className="w-4 h-4 text-teal-500" />
                                                                           <span className="text-sm text-teal-500 font-medium">Chủ tài khoản:</span>
                                                                           <span className="text-base font-semibold text-teal-900">
                                                                                {account.accountHolder || account.accountHolderName}
                                                                           </span>
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       </div>
                                                       <div className="flex gap-2 ml-4">
                                                            {!account.isDefault && (
                                                                 <Button
                                                                      variant="outline"
                                                                      size="sm"
                                                                      onClick={() => handleSetDefault(account.accountID)}
                                                                      className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                                                                      title="Đặt làm mặc định"
                                                                 >
                                                                      <Star className="w-4 h-4" />
                                                                 </Button>
                                                            )}
                                                            <Button
                                                                 variant="outline"
                                                                 size="sm"
                                                                 onClick={() => handleEdit(account)}
                                                                 className="border-teal-300 text-teal-700 hover:bg-teal-50 rounded-xl"
                                                            >
                                                                 <Edit3 className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                 variant="outline"
                                                                 size="sm"
                                                                 onClick={() => handleDelete(account.accountID)}
                                                                 className="border-red-300 text-red-700 hover:bg-red-50 rounded-xl"
                                                            >
                                                                 <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                       </div>
                                                  </div>
                                             </div>
                                        </FadeIn>
                                   ))}
                              </div>
                         )}
                    </CardContent>
               </Card>
          </SlideIn >
     );
}