import { useCallback, useRef, useState } from "react";
import Swal from "sweetalert2";

const GOONG_REST_API_KEY =
  process.env.REACT_APP_GOONG_REST_API_KEY || "89P5FAoUGyO5vDpUIeLtXDZ6Xti5NSlKQBJSR6Yu";
const GOONG_GEOCODE_URL = "https://rsapi.goong.io/Geocode";

export const useFieldForm = (bankAccounts = []) => {
  const complexImageInputRef = useRef(null);
  const [complexImageUploading, setComplexImageUploading] = useState(false);
  const [editingComplexId, setEditingComplexId] = useState(null);

  // Form state cho khu sân
  const [complexFormData, setComplexFormData] = useState({
    name: "",
    address: "",
    lat: null,
    lng: null,
    latitude: null,
    longitude: null,
    ward: "",
    district: "",
    province: "",
    description: "",
    image: "",
    imageFile: null,
    imageUrl: null,
    status: "Pending",
  });

  // Form state cho sân nhỏ
  const [formData, setFormData] = useState({
    complexId: "",
    name: "",
    typeId: "",
    size: "",
    grassType: "",
    description: "",
    mainImage: null,
    imageFiles: [],
    pricePerHour: "",
    status: "Available",
    bankAccountId: "",
    bankName: "",
    bankShortCode: "",
    accountNumber: "",
    accountHolder: "",
  });

  // thay đổi dữ liệu form sân nhỏ
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // thay đổi main image
  const handleMainImageChange = (image) => {
    setFormData(prev => ({
      ...prev,
      mainImage: image
    }));
  };

  // thay đổi danh sách ảnh gallery
  const handleImageFilesChange = (imagesArray) => {
    setFormData(prev => ({
      ...prev,
      imageFiles: imagesArray
    }));
  };

  // thay đổi tài khoản ngân hàng
  const handleBankAccountChange = (bankAccountId) => {
    const selectedAccount = bankAccounts.find(acc => acc.bankAccountId === Number(bankAccountId));
    if (selectedAccount) {
      setFormData(prev => ({
        ...prev,
        bankAccountId: bankAccountId,
        bankName: selectedAccount.bankName,
        bankShortCode: selectedAccount.bankShortCode || "",
        accountNumber: selectedAccount.accountNumber,
        accountHolder: selectedAccount.accountHolder,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        bankAccountId: "",
        bankName: "",
        bankShortCode: "",
        accountNumber: "",
        accountHolder: "",
      }));
    }
  };

  // upload ảnh khu sân
  const handleComplexImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Vui lòng chọn file ảnh hợp lệ',
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#ef4444'
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Kích thước file không được vượt quá 5MB',
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#ef4444'
        });
        return;
      }

      if (complexFormData.image && complexFormData.image.startsWith('blob:')) {
        URL.revokeObjectURL(complexFormData.image);
      }

      setComplexImageUploading(true);
      const objectUrl = URL.createObjectURL(file);

      setComplexFormData(prev => ({
        ...prev,
        imageFile: file,
        imageUrl: null,
        image: objectUrl
      }));

      setTimeout(() => setComplexImageUploading(false), 300);
    }
  };

  // thay đổi form khu sân
  const handleComplexFieldChange = (field, value) => {
    setComplexFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // xóa ảnh khu sân
  const removeComplexImage = () => {
    if (complexFormData.image && complexFormData.image.startsWith('blob:')) {
      URL.revokeObjectURL(complexFormData.image);
    }
    setComplexFormData(prev => ({
      ...prev,
      image: "",
      imageFile: null,
      imageUrl: null,
    }));
    if (complexImageInputRef.current) {
      complexImageInputRef.current.value = "";
    }
  };

  const triggerComplexImagePicker = () => {
    complexImageInputRef.current?.click();
  };

  // phím tắt cho upload ảnh khu sân
  const handleComplexUploadAreaKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      triggerComplexImagePicker();
    }
  };

  // đặt lại form khu sân
  const resetComplexForm = () => {
    if (complexFormData.image && complexFormData.image.startsWith('blob:')) {
      URL.revokeObjectURL(complexFormData.image);
    }
    setComplexFormData({
      name: "",
      address: "",
      lat: null,
      lng: null,
      latitude: null,
      longitude: null,
      ward: "",
      district: "",
      province: "",
      description: "",
      image: "",
      imageFile: null,
      imageUrl: null,
      status: "Active",
    });
    setComplexImageUploading(false);
    if (complexImageInputRef.current) {
      complexImageInputRef.current.value = "";
    }
  };

  // đặt lại form sân nhỏ
  const resetForm = (defaultComplexId = "") => {
    setFormData({
      complexId: defaultComplexId || "",
      name: "",
      typeId: "",
      size: "",
      grassType: "",
      description: "",
      mainImage: null,
      imageFiles: [],
      pricePerHour: "",
      status: "Available",
      bankAccountId: "",
      bankName: "",
      bankShortCode: "",
      accountNumber: "",
      accountHolder: "",
    });
  };

  // trích xuất phường, quận, tỉnh
  const extractAddressComponents = (addressComponents = []) => {
    let ward = "";
    let district = "";
    let province = "";

    addressComponents.forEach((component = {}) => {
      const types = component.types || [];
      if (types.includes("ward") || types.includes("sublocality")) {
        ward = component.long_name || component.short_name || "";
      } else if (
        types.includes("administrative_area_level_2") ||
        types.includes("district")
      ) {
        district = component.long_name || component.short_name || "";
      } else if (
        types.includes("administrative_area_level_1") ||
        types.includes("province")
      ) {
        province = component.long_name || component.short_name || "";
      }
    });

    return { ward, district, province };
  };

  // lấy tọa độ từ địa chỉ
  const geocodeAddress = useCallback(async (address) => {
    if (!address || !address.trim()) {
      return {
        success: false,
        error: "Địa chỉ không được để trống"
      };
    }
    try {
      const response = await fetch(
        `${GOONG_GEOCODE_URL}?api_key=${GOONG_REST_API_KEY}&address=${encodeURIComponent(
          address
        )}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error_message || errorData.message || `Lỗi API: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      if (data.error_message) {
        return {
          success: false,
          error: data.error_message
        };
      }

      const firstResult = data?.results?.[0];
      if (!firstResult) {
        return {
          success: false,
          error: "Không tìm thấy địa chỉ. Vui lòng thử lại với địa chỉ khác."
        };
      }

      const location = firstResult.geometry?.location || {};
      const lat = location.lat ?? firstResult.lat;
      const lng = location.lng ?? firstResult.lng;

      if (lat === undefined || lng === undefined || lat === null || lng === null) {
        return {
          success: false,
          error: "Không thể lấy được tọa độ từ địa chỉ này."
        };
      }

      const { ward, district, province } = extractAddressComponents(
        firstResult.address_components || []
      );

      return {
        success: true,
        data: {
          lat,
          lng,
          ward,
          district,
          province,
          address: firstResult.formatted_address || address,
        }
      };
    } catch (error) {
      console.error("Error geocoding address:", error);
      return {
        success: false,
        error: error.message || "Lỗi kết nối khi lấy tọa độ. Vui lòng thử lại sau."
      };
    }
  }, []);

  // chọn địa chỉ từ bản đồ
  const handleComplexAddressSelect = (locationData) => {
    setComplexFormData(prev => ({
      ...prev,
      address: locationData.address,
      lat: locationData.lat || locationData.latitude,
      lng: locationData.lng || locationData.longitude,
      latitude: locationData.latitude || locationData.lat,
      longitude: locationData.longitude || locationData.lng,
      ward: locationData.ward || "",
      district: locationData.district || "",
      province: locationData.province || "",
    }));
  };

  return {
    // Form state
    formData,
    setFormData,
    complexFormData,
    setComplexFormData,
    editingComplexId,
    setEditingComplexId,
    complexImageUploading,
    setComplexImageUploading,
    complexImageInputRef,

    // Form handlers
    handleInputChange,
    handleMainImageChange,
    handleImageFilesChange,
    handleBankAccountChange,
    handleComplexImageUpload,
    handleComplexFieldChange,
    removeComplexImage,
    triggerComplexImagePicker,
    handleComplexUploadAreaKeyDown,
    handleComplexAddressSelect,

    // Reset functions
    resetForm,
    resetComplexForm,

    // Utilities
    geocodeAddress,
    extractAddressComponents,
  };
};
