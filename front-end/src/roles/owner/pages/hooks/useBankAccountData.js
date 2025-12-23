import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  fetchOwnerBankAccounts,
  createOwnerBankAccount,
  updateOwnerBankAccount,
  deleteOwnerBankAccount,
  setDefaultBankAccount,
} from "../../../../shared/services/ownerBankAccount";
import { fetchAllComplexesWithFields, updateField } from "../../../../shared/services/fields";
import { findVietnamBankByCode } from "../../../../shared/constants/vietnamBanks";

export const useBankAccountData = (currentUserId, isDemo = false) => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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

  // Tải danh sách tài khoản ngân hàng
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
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
  }, [isDemo, currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Thay đổi form data
  const handleInputChange = useCallback((e) => {
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
  }, [errors]);

  // Thay đổi ngân hàng
  const handleBankCodeChange = useCallback((code) => {
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
  }, [errors]);

  // Validate form
  const validateForm = useCallback(() => {
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
  }, [formData]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      bankName: "",
      bankShortCode: "",
      accountNumber: "",
      accountHolder: "",
      isDefault: false
    });
    setErrors({});
    setEditingAccount(null);
  }, []);

  // Tạo tài khoản mới
  const handleCreateAccount = useCallback((setShowDemoRestrictedModal) => {
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
  }, [isDemo]);

  // Chỉnh sửa tài khoản
  const handleEditAccount = useCallback((account, setShowDemoRestrictedModal) => {
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
  }, [isDemo]);

  // Submit form
  const handleSubmit = useCallback(async (e, setShowDemoRestrictedModal) => {
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

    const normalizedAccountNumber = formData.accountNumber.replace(/\s/g, '');
    const duplicateAccount = bankAccounts.find(acc => {
      if (editingAccount && acc.bankAccountId === editingAccount.bankAccountId) {
        return false;
      }
      return acc.accountNumber === normalizedAccountNumber;
    });

    if (duplicateAccount) {
      Swal.fire({
        icon: 'warning',
        title: 'Số tài khoản đã tồn tại',
        text: `Số tài khoản ${normalizedAccountNumber} đã được đăng ký với ngân hàng ${duplicateAccount.bankName}.`,
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    try {
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
  }, [isDemo, validateForm, formData, bankAccounts, editingAccount, currentUserId, resetForm, loadData]);

  // Xóa tài khoản
  const handleDeleteAccount = useCallback(async (account, setShowDemoRestrictedModal) => {
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
        let errorText = error.message || 'Không thể xóa tài khoản ngân hàng.';

        if (error.message && error.message.includes('đang được sử dụng')) {
          errorTitle = 'Tài khoản đang được sử dụng';
        }

        await Swal.fire({
          icon: 'error',
          title: errorTitle,
          text: errorText,
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  }, [isDemo, loadData]);

  // Đặt tài khoản mặc định
  const handleSetDefault = useCallback(async (account, setShowDemoRestrictedModal) => {
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }

    try {
      await setDefaultBankAccount(account.bankAccountId, Number(currentUserId));

      // Cập nhật BankAccountID cho tất cả fields của owner
      let updatedCount = 0;
      let failedCount = 0;
      try {
        const allComplexesWithFields = await fetchAllComplexesWithFields();

        const ownerComplexes = allComplexesWithFields.filter(
          complex => {
            const complexOwnerId = complex.ownerId || complex.OwnerID || complex.ownerID;
            return complexOwnerId === currentUserId || complexOwnerId === Number(currentUserId);
          }
        );

        const allFields = [];
        ownerComplexes.forEach(complex => {
          if (complex.fields && Array.isArray(complex.fields)) {
            allFields.push(...complex.fields);
          }
        });

        if (allFields.length > 0) {
          const updateResults = await Promise.allSettled(
            allFields.map(async (field) => {
              try {
                const fieldId = field.fieldId || field.FieldID || field.id;
                if (!fieldId) return { success: false, skipped: true };

                const complexId = field.complexId || field.ComplexID || field.complexID;
                const typeId = field.typeId || field.TypeID || field.typeID;
                const name = field.name || field.Name;

                if (!complexId || !typeId || !name) {
                  return { success: false, skipped: true };
                }

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
              } catch (error) {
                return { success: false, error: error.message };
              }
            })
          );

          updateResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.success) {
              updatedCount++;
            } else {
              failedCount++;
            }
          });
        }
      } catch (error) {
        console.error("Error updating fields:", error);
      }

      let message = `Tài khoản ${account.bankName} đã được đặt làm tài khoản mặc định.`;
      if (updatedCount > 0) {
        message += `\nĐã cập nhật BankAccountID cho ${updatedCount} sân thành công.`;
      }
      if (failedCount > 0) {
        message += `\nCó ${failedCount} sân cập nhật thất bại.`;
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
  }, [isDemo, currentUserId, loadData]);

  return {
    bankAccounts,
    setBankAccounts,
    loading,
    showModal,
    setShowModal,
    editingAccount,
    setEditingAccount,
    formData,
    setFormData,
    errors,
    setErrors,
    selectedBankMeta,
    loadData,
    handleInputChange,
    handleBankCodeChange,
    validateForm,
    resetForm,
    handleCreateAccount,
    handleEditAccount,
    handleSubmit,
    handleDeleteAccount,
    handleSetDefault,
  };
};
