import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import {
  createField,
  createFieldComplex,
  updateField,
  deleteField,
  updateFieldComplex,
  deleteFieldComplex,
  validateComplexData,
  validateFieldData
} from "../../../../shared/services/fields";

const MAX_FIELD_IMAGES = 4;

export const useFieldActions = ({
  user,
  isDemo,
  complexes,
  setComplexes,
  bankAccounts,
  fieldTypeMap,
  formData,
  setFormData,
  complexFormData,
  setComplexFormData,
  editingComplexId,
  setEditingComplexId,
  complexImageInputRef,
  resetForm,
  resetComplexForm,
  geocodeAddress,
  loadData,
  setShowDemoRestrictedModal,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddComplexModalOpen, setIsAddComplexModalOpen] = useState(false);
  const [isEditComplexModalOpen, setIsEditComplexModalOpen] = useState(false);

  const ownerId = user?.userID || user?.UserID || user?.id || user?.userId;

  // upload khu sân mới hoặc cập nhật khu sân
  const handleComplexSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi xác thực',
        text: 'Bạn cần đăng nhập để thực hiện thao tác này.',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const userRole = user?.roleName || user?.role;
    if (userRole !== "Owner" && userRole !== "FieldOwner") {
      await Swal.fire({
        icon: 'error',
        title: 'Không có quyền',
        text: 'Chỉ tài khoản Owner mới có thể thêm khu sân.',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    if (!ownerId) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không tìm thấy thông tin chủ sân (UserID). Vui lòng đăng nhập lại.',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const isEditingComplex = Boolean(isEditComplexModalOpen && editingComplexId);
    const actionLabel = isEditingComplex ? 'cập nhật khu sân' : 'tạo khu sân';

    const complexValidation = validateComplexData(complexFormData, isEditingComplex);
    if (!complexValidation.isValid) {
      const firstError = Object.values(complexValidation.errors)[0];
      await Swal.fire({
        icon: 'warning',
        title: 'Dữ liệu không hợp lệ!',
        text: firstError,
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    try {
      let lat = complexFormData.latitude ?? complexFormData.lat;
      let lng = complexFormData.longitude ?? complexFormData.lng;
      let ward = complexFormData.ward;
      let district = complexFormData.district;
      let province = complexFormData.province;

      const hasLat = lat !== null && lat !== undefined && lat !== "";
      const hasLng = lng !== null && lng !== undefined && lng !== "";

      if ((!hasLat || !hasLng) && complexFormData.address) {
        const geocodeResult = await geocodeAddress(complexFormData.address);
        if (geocodeResult && geocodeResult.success && geocodeResult.data) {
          const geocoded = geocodeResult.data;
          lat = geocoded.lat;
          lng = geocoded.lng;
          ward = ward || geocoded.ward;
          district = district || geocoded.district;
          province = province || geocoded.province;

          setComplexFormData(prev => ({
            ...prev,
            address: geocoded.address || prev.address,
            lat: geocoded.lat,
            lng: geocoded.lng,
            latitude: geocoded.lat,
            longitude: geocoded.lng,
            ward: ward || geocoded.ward,
            district: district || geocoded.district,
            province: province || geocoded.province,
          }));
        } else {
          const errorMessage = geocodeResult?.error || "Không lấy được tọa độ từ địa chỉ.";
          await Swal.fire({
            icon: "error",
            title: "Lỗi lấy tọa độ",
            text: errorMessage,
            confirmButtonText: "Đóng",
            confirmButtonColor: "#ef4444",
          });
          return;
        }
      }

      const latToUse = lat !== null && lat !== undefined && lat !== ""
        ? Number.isNaN(Number(lat)) ? lat : Number(lat)
        : null;
      const lngToUse = lng !== null && lng !== undefined && lng !== ""
        ? Number.isNaN(Number(lng)) ? lng : Number(lng)
        : null;

      if (isEditingComplex) {
        const updatePayload = new FormData();
        updatePayload.append("ComplexId", String(editingComplexId));
        updatePayload.append("OwnerId", String(Number(ownerId)));
        updatePayload.append("Name", complexFormData.name);
        updatePayload.append("Address", complexFormData.address);
        updatePayload.append("Description", complexFormData.description || "");
        updatePayload.append("Status", complexFormData.status || "Pending");

        if (complexFormData.imageFile) {
          updatePayload.append("ImageFile", complexFormData.imageFile);
        } else if (complexFormData.imageUrl) {
          updatePayload.append("ImageUrl", complexFormData.imageUrl);
        }

        if (latToUse !== null && latToUse !== undefined) {
          updatePayload.append("Lat", String(latToUse));
        }
        if (lngToUse !== null && lngToUse !== undefined) {
          updatePayload.append("Lng", String(lngToUse));
        }
        if (ward) updatePayload.append("Ward", ward);
        if (district) updatePayload.append("District", district);
        if (province) updatePayload.append("Province", province);

        const existingComplex = complexes.find(c => c.complexId === editingComplexId);
        if (existingComplex?.createdAt) {
          updatePayload.append("CreatedAt", existingComplex.createdAt);
        }

        await updateFieldComplex(editingComplexId, updatePayload);

        await Swal.fire({
          icon: 'success',
          title: 'Cập nhật khu sân thành công!',
          confirmButtonColor: '#10b981',
          timer: 2000,
          showConfirmButton: true
        });

        setIsAddComplexModalOpen(false);
        setIsEditComplexModalOpen(false);
        if (complexFormData.image && complexFormData.image.startsWith('blob:')) {
          URL.revokeObjectURL(complexFormData.image);
        }
        resetComplexForm();
        setEditingComplexId(null);
        await loadData();
        return;
      }

      // Tạo khu sân mới
      let newComplexResponse;
      if (complexFormData.imageFile) {
        const formDataToSend = new FormData();
        formDataToSend.append("ComplexId", "0");
        formDataToSend.append("OwnerId", String(Number(ownerId)));
        formDataToSend.append("Name", complexFormData.name);
        formDataToSend.append("Address", complexFormData.address);
        formDataToSend.append("Description", complexFormData.description || "");
        formDataToSend.append("Status", "Pending");
        formDataToSend.append("ImageFile", complexFormData.imageFile);

        if (latToUse !== null && latToUse !== undefined) {
          formDataToSend.append("Lat", String(latToUse));
          formDataToSend.append("Latitude", String(latToUse));
        }
        if (lngToUse !== null && lngToUse !== undefined) {
          formDataToSend.append("Lng", String(lngToUse));
          formDataToSend.append("Longitude", String(lngToUse));
        }
        if (ward) formDataToSend.append("Ward", ward);
        if (district) formDataToSend.append("District", district);
        if (province) formDataToSend.append("Province", province);

        newComplexResponse = await createFieldComplex(formDataToSend);
      } else {
        const payload = {
          complexId: 0,
          ownerId: Number(ownerId),
          name: complexFormData.name,
          address: complexFormData.address,
          description: complexFormData.description || "",
          imageUrl: complexFormData.imageUrl || "",
          status: "Pending",
        };

        if (latToUse !== null && latToUse !== undefined) {
          payload.lat = latToUse;
          payload.latitude = latToUse;
        }
        if (lngToUse !== null && lngToUse !== undefined) {
          payload.lng = lngToUse;
          payload.longitude = lngToUse;
        }
        if (ward) payload.ward = ward;
        if (district) payload.district = district;
        if (province) payload.province = province;

        newComplexResponse = await createFieldComplex(payload);
      }

      let newComplex = Array.isArray(newComplexResponse) ? newComplexResponse[0] : newComplexResponse;

      const normalizedComplex = {
        complexId: newComplex.complexId,
        ownerId: newComplex.ownerId,
        name: newComplex.name,
        address: newComplex.address,
        description: newComplex.description || null,
        image: newComplex.image || null,
        status: newComplex.status,
        createdAt: newComplex.createdAt,
        ownerName: newComplex.ownerName || null,
        fields: newComplex.fields || []
      };

      setComplexes(prev => [...prev, normalizedComplex]);
      const result = await Swal.fire({
        icon: 'success',
        title: 'Tạo khu sân thành công!',
        text: `Khu sân "${normalizedComplex.name}" đã được tạo thành công.`,
        confirmButtonColor: '#10b981',
        showCancelButton: true,
        cancelButtonText: 'Đóng',
        confirmButtonText: 'Thêm sân ngay',
        timer: 5000
      });

      setIsAddComplexModalOpen(false);
      setIsEditComplexModalOpen(false);
      if (complexFormData.image && complexFormData.image.startsWith('blob:')) {
        URL.revokeObjectURL(complexFormData.image);
      }
      resetComplexForm();
      setEditingComplexId(null);

      if (result.isConfirmed) {
        await loadData();
        resetForm(normalizedComplex.complexId);
        setIsAddModalOpen(true);
      } else {
        await loadData();
      }
    } catch (error) {
      let errorMessage = `Có lỗi xảy ra khi ${actionLabel}`;
      if (error.response) {
        const { status, data } = error.response;
        if (status === 400 && data) {
          errorMessage = data.message || data.title || data.error || 'Dữ liệu không hợp lệ';
        } else if (status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (status === 403) {
          errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
        } else if (status === 500) {
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: errorMessage,
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#ef4444'
      });
    }
  }, [isDemo, user, ownerId, isEditComplexModalOpen, editingComplexId, complexFormData, complexes, setComplexes, geocodeAddress, setComplexFormData, resetComplexForm, setEditingComplexId, loadData, resetForm, setShowDemoRestrictedModal]);

  // thêm sân nhỏ mới hoặc cập nhật sân nhỏ
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Lỗi xác thực",
        text: "Bạn cần đăng nhập (Owner) trước khi thêm sân.",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    const userRole = user?.roleName || user?.role;
    if (userRole !== "Owner" && userRole !== "FieldOwner") {
      await Swal.fire({
        icon: "error",
        title: "Không có quyền",
        text: "Chỉ tài khoản Owner mới có thể thêm sân.",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    try {
      const isEditingField = Boolean(isEditModalOpen && formData.fieldId);

      const fieldValidation = validateFieldData(formData, isEditingField);
      if (!fieldValidation.isValid) {
        const firstError = Object.values(fieldValidation.errors)[0];
        await Swal.fire({
          icon: 'warning',
          title: 'Dữ liệu không hợp lệ!',
          text: firstError,
          confirmButtonColor: '#f59e0b'
        });
        return;
      }

      const isFile = (value) => value instanceof File;
      const isUrl = (value) => {
        if (!value || typeof value !== 'string') return false;
        return value.startsWith('http://') || value.startsWith('https://');
      };

      const formDataToSend = new FormData();
      formDataToSend.append("ComplexId", formData.complexId);
      formDataToSend.append("TypeId", String(fieldTypeMap[formData.typeId] || parseInt(formData.typeId)));
      formDataToSend.append("Name", formData.name);
      formDataToSend.append("Size", formData.size || "");
      formDataToSend.append("GrassType", formData.grassType || "");
      formDataToSend.append("Description", formData.description || "");
      formDataToSend.append("PricePerHour", String(parseFloat(formData.pricePerHour) || 0));
      formDataToSend.append("Status", formData.status || "Available");
      formDataToSend.append("BankAccountId", String(formData.bankAccountId));
      formDataToSend.append("BankName", formData.bankName);
      formDataToSend.append("BankShortCode", formData.bankShortCode || "");
      formDataToSend.append("AccountNumber", formData.accountNumber);
      formDataToSend.append("AccountHolder", formData.accountHolder);

      const newMainImageFile = formData.mainImage && isFile(formData.mainImage) ? formData.mainImage : null;
      const existingMainImageUrl = formData.mainImage && isUrl(formData.mainImage) ? formData.mainImage : null;
      const newGalleryFiles = formData.imageFiles?.filter(img => isFile(img)) || [];
      const existingGalleryUrls = formData.imageFiles?.filter(img => isUrl(img)) || [];

      if (newMainImageFile) {
        formDataToSend.append("MainImage", newMainImageFile);
      }
      if (isEditingField && existingMainImageUrl) {
        formDataToSend.append("MainImageUrl", existingMainImageUrl);
      }
      if (newGalleryFiles.length > 0) {
        newGalleryFiles.forEach((file) => {
          formDataToSend.append("ImageFiles", file);
        });
      }
      if (isEditingField && existingGalleryUrls.length > 0) {
        existingGalleryUrls.forEach((url) => {
          formDataToSend.append("ImageUrls", url);
        });
      }

      if (isEditModalOpen && formData.fieldId) {
        formDataToSend.append("FieldId", formData.fieldId);
        await updateField(formData.fieldId, formDataToSend);
      } else {
        await createField(formDataToSend);
      }

      await Swal.fire({
        icon: 'success',
        title: isEditModalOpen ? 'Cập nhật thành công!' : 'Tạo sân thành công!',
        text: isEditModalOpen
          ? 'Thông tin sân đã được cập nhật.'
          : `Sân "${formData.name}" đã được tạo thành công.`,
        confirmButtonColor: '#10b981',
        timer: 2000,
        showConfirmButton: true
      });

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving field:', error);
      const errorMessage = error.message || "Có lỗi xảy ra khi lưu sân";
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: errorMessage,
        confirmButtonColor: '#ef4444'
      });
    }
  }, [isDemo, user, isEditModalOpen, formData, fieldTypeMap, resetForm, loadData, setShowDemoRestrictedModal]);

  // chỉnh sửa sân nhỏ
  const handleEdit = useCallback((field) => {
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }
    const typeKey = Object.keys(fieldTypeMap).find(
      key => fieldTypeMap[key] === field.typeId
    ) || "";

    let matchingAccount = null;
    if (field.bankAccountId) {
      matchingAccount = bankAccounts.find(acc =>
        acc.bankAccountId === Number(field.bankAccountId) ||
        acc.bankAccountId === field.bankAccountId
      );
    }
    if (!matchingAccount && field.bankName && field.accountNumber) {
      matchingAccount = bankAccounts.find(acc =>
        acc.bankName === field.bankName &&
        acc.accountNumber === field.accountNumber
      );
    }

    let mainImage = null;
    let galleryImages = [];

    if (field.mainImageUrl) {
      mainImage = field.mainImageUrl;
    }

    if (Array.isArray(field.imageUrls) && field.imageUrls.length > 0) {
      galleryImages = field.imageUrls.filter(Boolean).slice(0, MAX_FIELD_IMAGES);
    } else if (Array.isArray(field.images) && field.images.length > 0) {
      galleryImages = field.images.filter(Boolean).slice(0, MAX_FIELD_IMAGES);
    }

    setFormData({
      fieldId: field.fieldId,
      complexId: field.complexId,
      name: field.name,
      typeId: typeKey,
      size: field.size || "",
      grassType: field.grassType || "",
      description: field.description || "",
      mainImage: mainImage,
      imageFiles: galleryImages,
      pricePerHour: field.pricePerHour || "",
      status: field.status || "Available",
      bankAccountId: matchingAccount ? String(matchingAccount.bankAccountId) : (field.bankAccountId ? String(field.bankAccountId) : ""),
      bankName: matchingAccount?.bankName || field.bankName || "",
      bankShortCode: matchingAccount?.bankShortCode || field.bankShortCode || "",
      accountNumber: matchingAccount?.accountNumber || field.accountNumber || "",
      accountHolder: matchingAccount?.accountHolder || field.accountHolder || "",
    });
    setIsEditModalOpen(true);
  }, [isDemo, fieldTypeMap, bankAccounts, setFormData, setShowDemoRestrictedModal]);

  // xóa sân nhỏ
  const handleDelete = useCallback(async (fieldId) => {
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }
    const result = await Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Bạn không thể hoàn tác hành động này!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await deleteField(fieldId);
        await Swal.fire({
          icon: 'success',
          title: 'Đã xóa!',
          text: 'Sân đã được xóa thành công.',
          confirmButtonColor: '#10b981',
          timer: 2000
        });
        loadData();
      } catch (error) {
        console.error('Error deleting field:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: error.message || "Có lỗi xảy ra khi xóa sân",
          confirmButtonColor: '#ef4444'
        });
      }
    }
  }, [isDemo, loadData, setShowDemoRestrictedModal]);

  // thêm sân nhỏ
  const handleAddField = useCallback((defaultComplexId = "") => {
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }
    if (complexes.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Chưa có khu sân!',
        text: 'Vui lòng tạo khu sân trước khi thêm sân.',
        confirmButtonColor: '#3b82f6',
        showCancelButton: true,
        cancelButtonText: 'Hủy',
        confirmButtonText: 'Tạo khu sân',
      }).then((result) => {
        if (result.isConfirmed) {
          // Gọi trực tiếp logic thay vì gọi handleAddComplex
          resetComplexForm();
          setEditingComplexId(null);
          setIsEditComplexModalOpen(false);
          setIsAddComplexModalOpen(true);
        }
      });
      return;
    }
    resetForm(defaultComplexId);
    const defaultAccount = bankAccounts.find(acc => acc.isDefault) || bankAccounts[0];
    if (defaultAccount) {
      setFormData(prev => ({
        ...prev,
        bankAccountId: String(defaultAccount.bankAccountId),
        bankName: defaultAccount.bankName,
        bankShortCode: defaultAccount.bankShortCode || "",
        accountNumber: defaultAccount.accountNumber,
        accountHolder: defaultAccount.accountHolder,
      }));
    }
    setIsAddModalOpen(true);
  }, [isDemo, complexes, bankAccounts, resetForm, setFormData, setShowDemoRestrictedModal, resetComplexForm, setEditingComplexId]);

  // thêm khu sân
  const handleAddComplex = useCallback(() => {
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }
    resetComplexForm();
    setEditingComplexId(null);
    setIsEditComplexModalOpen(false);
    setIsAddComplexModalOpen(true);
  }, [isDemo, resetComplexForm, setEditingComplexId, setShowDemoRestrictedModal]);

  // chỉnh sửa khu sân
  const handleEditComplex = useCallback((complex) => {
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }

    if (complexFormData.image && complexFormData.image.startsWith('blob:')) {
      URL.revokeObjectURL(complexFormData.image);
    }

    const complexImageUrl = complex.imageUrl || complex.ImageUrl || null;
    const complexStatus = complex.status || complex.Status || "Active";

    setComplexFormData({
      name: complex.name || "",
      address: complex.address || "",
      lat: complex.lat ?? complex.Lat ?? complex.latitude ?? complex.Latitude ?? null,
      lng: complex.lng ?? complex.Lng ?? complex.longitude ?? complex.Longitude ?? null,
      latitude: complex.latitude ?? complex.Latitude ?? complex.lat ?? complex.Lat ?? null,
      longitude: complex.longitude ?? complex.Longitude ?? complex.lng ?? complex.Lng ?? null,
      ward: complex.ward || complex.Ward || "",
      district: complex.district || complex.District || "",
      province: complex.province || complex.Province || "",
      description: complex.description || complex.Description || "",
      image: complexImageUrl || "",
      imageUrl: complexImageUrl,
      imageFile: null,
      status: complexStatus,
    });
    setEditingComplexId(complex.complexId || complex.ComplexID);
    if (complexImageInputRef.current) {
      complexImageInputRef.current.value = "";
    }
    setIsAddComplexModalOpen(false);
    setIsEditComplexModalOpen(true);
  }, [isDemo, complexFormData.image, setComplexFormData, setEditingComplexId, complexImageInputRef, setShowDemoRestrictedModal]);

  // xóa khu sân
  const handleDeleteComplex = useCallback(async (complexId) => {
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }

    const result = await Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: 'Khu sân và các sân nhỏ liên quan có thể bị ảnh hưởng. Hành động này không thể hoàn tác.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await deleteFieldComplex(complexId);
        await Swal.fire({
          icon: 'success',
          title: 'Đã xóa!',
          text: 'Khu sân đã được xóa thành công.',
          confirmButtonColor: '#10b981',
          timer: 2000
        });
        loadData();
      } catch (error) {
        console.error('Error deleting complex:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: error.message || 'Có lỗi xảy ra khi xóa khu sân',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  }, [isDemo, loadData, setShowDemoRestrictedModal]);

  // thay đổi trạng thái khu sân nhanh
  const handleToggleComplexStatus = useCallback(async (complex) => {
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }

    const complexId = complex.complexId || complex.ComplexID;
    const currentStatus = complex.status || "Active";
    const newStatus = currentStatus === "Active" ? "Deactive" : "Active";
    
    setComplexes(prevComplexes =>
      prevComplexes.map(c =>
        (c.complexId || c.ComplexID) === complexId
          ? { ...c, status: newStatus }
          : c
      )
    );

    try {
      const imageUrl = complex.imageUrl || complex.ImageUrl || complex.image || complex.Image || "";
      const updatePayload = new FormData();
      updatePayload.append("ComplexId", String(complexId));
      updatePayload.append("OwnerId", String(complex.ownerId || complex.OwnerID));
      updatePayload.append("Name", complex.name || complex.Name);
      updatePayload.append("Address", complex.address || complex.Address);
      updatePayload.append("Description", complex.description || complex.Description || "");
      updatePayload.append("Status", newStatus);
      updatePayload.append("CreatedAt", complex.createdAt || complex.CreatedAt || "");
      
      if (imageUrl) {
        try {
          const response = await fetch(imageUrl);
          if (response.ok) {
            const blob = await response.blob();
            const fileName = imageUrl.split('/').pop() || 'image.jpg';
            const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
            updatePayload.append("ImageFile", file);
          }
        } catch (fetchError) {
          // ignore fetch error
        }
      }

      const lat = complex.latitude || complex.Latitude || complex.lat || complex.Lat;
      const lng = complex.longitude || complex.Longitude || complex.lng || complex.Lng;

      if (lat !== null && lat !== undefined) {
        updatePayload.append("Lat", String(lat));
        updatePayload.append("Latitude", String(lat));
      }
      if (lng !== null && lng !== undefined) {
        updatePayload.append("Lng", String(lng));
        updatePayload.append("Longitude", String(lng));
      }
      if (complex.ward || complex.Ward) {
        updatePayload.append("Ward", complex.ward || complex.Ward);
      }
      if (complex.district || complex.District) {
        updatePayload.append("District", complex.district || complex.District);
      }
      if (complex.province || complex.Province) {
        updatePayload.append("Province", complex.province || complex.Province);
      }

      await updateFieldComplex(complexId, updatePayload);
      await loadData();
      await Swal.fire({
        icon: 'success',
        title: newStatus === "Active" ? 'Đã kích hoạt thành công!' : 'Đã vô hiệu hóa thành công!',
        html: `<p>Khu sân "${complex.name || complex.Name}" đã được ${newStatus === "Active" ? "kích hoạt" : "vô hiệu hóa"}.</p>`,
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#10b981',
        timer: 3000,
        showConfirmButton: true
      });
    } catch (error) {
      setComplexes(prevComplexes =>
        prevComplexes.map(c =>
          (c.complexId || c.ComplexID) === complexId
            ? { ...c, status: currentStatus }
            : c
        )
      );

      console.error('Error toggling complex status:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái khu sân';
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: errorMessage,
        confirmButtonColor: '#ef4444'
      });
    }
  }, [isDemo, setComplexes, loadData, setShowDemoRestrictedModal]);

  // đóng modal sân nhỏ
  const handleCloseFieldModal = useCallback(() => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    resetForm();
  }, [resetForm]);

  // đóng modal khu sân
  const handleCloseComplexModal = useCallback(() => {
    setIsAddComplexModalOpen(false);
    setIsEditComplexModalOpen(false);
    setEditingComplexId(null);
    resetComplexForm();
  }, [resetComplexForm, setEditingComplexId]);

  // yêu cầu tạo khu sân từ modal thêm sân nhỏ
  const handleRequestCreateComplex = useCallback(() => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    // Gọi trực tiếp logic thay vì gọi handleAddComplex để tránh circular dependency
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }
    resetComplexForm();
    setEditingComplexId(null);
    setIsEditComplexModalOpen(false);
    setIsAddComplexModalOpen(true);
  }, [isDemo, resetComplexForm, setEditingComplexId, setShowDemoRestrictedModal]);

  // chuyển đến trang quản lý tài khoản ngân hàng
  const handleNavigateBankAccounts = useCallback(() => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    resetForm();
    window.location.href = '/owner/bank-accounts';
  }, [resetForm]);

  return {
    // Modal states
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isAddComplexModalOpen,
    setIsAddComplexModalOpen,
    isEditComplexModalOpen,
    setIsEditComplexModalOpen,

    // Actions
    handleComplexSubmit,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleAddField,
    handleAddComplex,
    handleEditComplex,
    handleDeleteComplex,
    handleToggleComplexStatus,
    handleCloseFieldModal,
    handleCloseComplexModal,
    handleRequestCreateComplex,
    handleNavigateBankAccounts,
  };
};
