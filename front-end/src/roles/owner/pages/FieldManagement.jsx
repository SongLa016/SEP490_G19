import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
     Plus,
     Edit,
     Trash2,
     MapPin,
     DollarSign,
     Loader2,
     Building2,
     Power,
     PowerOff
} from "lucide-react";
import Swal from "sweetalert2";
import { Button, Card, Pagination, usePagination } from "../../../shared/components/ui";
import { DemoRestrictedModal } from "../../../shared";
import {
     createField,
     createFieldComplex,
     updateField,
     deleteField,
     fetchAllComplexesWithFields,
     createFieldPrice,
     updateFieldComplex,
     deleteFieldComplex,
     validateComplexData,
     validateFieldData
} from "../../../shared/services/fields";
import { fetchTimeSlots } from "../../../shared/services/timeSlots";
import { fetchOwnerBankAccounts } from "../../../shared/services/ownerBankAccount";
import { useFieldTypes } from "../../../shared/hooks";
import FieldFormModal from "./components/fieldManagement/FieldFormModal";
import ComplexFormModal from "./components/fieldManagement/ComplexFormModal";
import { useAuth } from "../../../contexts/AuthContext";

const MAX_FIELD_IMAGES = 4;
const GOONG_REST_API_KEY =
     process.env.REACT_APP_GOONG_REST_API_KEY || "89P5FAoUGyO5vDpUIeLtXDZ6Xti5NSlKQBJSR6Yu";
const GOONG_GEOCODE_URL = "https://rsapi.goong.io/Geocode";

const FieldManagement = ({ isDemo = false }) => {
     const { user, logout } = useAuth();

     // Use React Query hook for field types
     const { data: apiFieldTypes = [], isLoading: loadingFieldTypes } = useFieldTypes();

     const [isAddModalOpen, setIsAddModalOpen] = useState(false);
     const [isEditModalOpen, setIsEditModalOpen] = useState(false);
     const [isAddComplexModalOpen, setIsAddComplexModalOpen] = useState(false);
     const [isEditComplexModalOpen, setIsEditComplexModalOpen] = useState(false);
     const [editingComplexId, setEditingComplexId] = useState(null);
     const [complexImageUploading, setComplexImageUploading] = useState(false);
     const complexImageInputRef = useRef(null);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [loading, setLoading] = useState(true);
     const [fields, setFields] = useState([]);
     const [complexes, setComplexes] = useState([]);
     const [timeSlots, setTimeSlots] = useState([]);
     const [bankAccounts, setBankAccounts] = useState([]);
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
          image: "", // Preview URL (ObjectURL for File or URL string from Cloudinary)
          imageFile: null, // File object (new upload) or null
          imageUrl: null, // URL string from Cloudinary (existing image)
          status: "Pending", // Default to Pending until admin approves
     });
     const [formData, setFormData] = useState({
          complexId: "",
          name: "",
          typeId: "",
          size: "",
          grassType: "",
          description: "",
          mainImage: null, // File object (new upload) or URL string (from Cloudinary)
          imageFiles: [], // Array of File objects (new uploads) or URL strings (from Cloudinary)
          pricePerHour: "",
          status: "Available",
          bankAccountId: "",
          bankName: "",
          bankShortCode: "",
          accountNumber: "",
          accountHolder: "",
     });

     // Map field types
     // Transform API field types to format expected by form
     const fieldTypes = useMemo(() => {
          return apiFieldTypes.map(type => ({
               value: String(type.typeId || type.TypeID),
               label: type.typeName || type.TypeName,
               typeId: type.typeId || type.TypeID
          }));
     }, [apiFieldTypes]);

     // Create fieldTypeMap for backward compatibility
     const fieldTypeMap = useMemo(() => {
          const map = {};
          apiFieldTypes.forEach(type => {
               const typeId = type.typeId || type.TypeID;
               map[String(typeId)] = typeId;
          });
          return map;
     }, [apiFieldTypes]);

     const fieldStatuses = [
          { value: "Available", label: "Có sẵn" },
          { value: "Maintenance", label: "Bảo trì" },
          { value: "Unavailable", label: "Không khả dụng" },
     ];

     const complexFieldCounts = useMemo(() => {
          return fields.reduce((acc, field) => {
               acc[field.complexId] = (acc[field.complexId] || 0) + 1;
               return acc;
          }, {});
     }, [fields]);

     // Get current user ID - extract to avoid complex expression in dependency array
     const currentUserId = useMemo(() => {
          return user?.userID || user?.UserID || user?.id || user?.userId || null;
     }, [user?.userID, user?.UserID, user?.id, user?.userId]);

     const loadData = useCallback(async () => {
          try {
               setLoading(true);
               if (!isDemo && currentUserId) {
                    // Sử dụng function mới để lấy tất cả khu sân và sân nhỏ
                    // Bước 1: Lấy tất cả khu sân từ GET /api/FieldComplex
                    // Bước 2: Với mỗi khu sân, lấy các sân nhỏ từ GET /api/Field/complex/{complexId}
                    const allComplexesWithFields = await fetchAllComplexesWithFields();

                    // Lọc chỉ lấy các khu sân của owner hiện tại
                    const ownerComplexes = allComplexesWithFields
                         .filter(
                              complex => complex.ownerId === currentUserId || complex.ownerId === Number(currentUserId)
                         )
                         .map(complex => ({
                              complexId: complex.complexId,
                              ownerId: complex.ownerId,
                              name: complex.name,
                              address: complex.address,
                              description: complex.description || null,
                              // Only use imageUrl from Cloudinary
                              image: complex.imageUrl || null,
                              imageUrl: complex.imageUrl || null,
                              status: complex.status,
                              createdAt: complex.createdAt,
                              ownerName: complex.ownerName || null,
                              fields: complex.fields || [],
                              fieldCount: complex.fieldCount || 0,
                              lat: complex.lat || complex.latitude,
                              lng: complex.lng || complex.longitude,
                              latitude: complex.latitude || complex.lat,
                              longitude: complex.longitude || complex.lng,
                              ward: complex.ward || "",
                              district: complex.district || "",
                              province: complex.province || "",
                         }));
                    setComplexes(ownerComplexes);

                    // Tạo danh sách tất cả các sân nhỏ từ các khu sân
                    const allFields = [];
                    for (const complex of ownerComplexes) {
                         // Fields đã được lấy sẵn trong complex.fields
                         allFields.push(...(complex.fields || []).map(f => {
                              // Map TypeID to typeName from apiFieldTypes
                              const fieldType = apiFieldTypes.find(
                                   type => (type.typeId || type.TypeID) === f.typeId
                              );

                              // Normalize image fields - API may return different field names
                              const normalizedField = {
                                   ...f,
                                   complexName: complex.name,
                                   complexAddress: complex.address,
                                   complexStatus: complex.status, // Thêm trạng thái khu sân để lọc
                                   typeName: fieldType ? (fieldType.typeName || fieldType.TypeName) : null,
                              };

                              // Ensure mainImage is available from URLs (Cloudinary only)
                              if (!normalizedField.mainImage && f.mainImageUrl) {
                                   normalizedField.mainImage = f.mainImageUrl;
                              }

                              // Ensure images array is available from URLs (Cloudinary only)
                              if (!normalizedField.images || normalizedField.images.length === 0) {
                                   if (Array.isArray(f.imageUrls) && f.imageUrls.length > 0) {
                                        normalizedField.images = f.imageUrls;
                                   }
                              }

                              return normalizedField;
                         }));
                    }
                    setFields(allFields);

                    // Fetch time slots
                    const slotsResponse = await fetchTimeSlots();
                    if (slotsResponse.success) {
                         setTimeSlots(slotsResponse.data || []);
                    }

                    // Fetch bank accounts for owner
                    try {
                         const accounts = await fetchOwnerBankAccounts(Number(currentUserId));
                         setBankAccounts(accounts || []);
                    } catch (error) {
                         console.error('Error loading bank accounts:', error);
                    }
               }
          } catch (error) {
               console.error('Error loading data:', error);
          } finally {
               setLoading(false);
          }
     }, [currentUserId, isDemo, apiFieldTypes]);

     useEffect(() => {
          loadData();
     }, [loadData]);

     const handleInputChange = (e) => {
          const { name, value } = e.target;
          setFormData(prev => ({
               ...prev,
               [name]: value
          }));
     };

     // Handle main image change (File object or URL string)
     const handleMainImageChange = (image) => {
          setFormData(prev => ({
               ...prev,
               mainImage: image
          }));
     };

     // Handle gallery images change (array of File objects or URL strings)
     const handleImageFilesChange = (imagesArray) => {
          setFormData(prev => ({
               ...prev,
               imageFiles: imagesArray
          }));
     };

     const handleComplexImageUpload = (e) => {
          const file = e.target.files?.[0];
          if (file) {
               // Validate file type
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

               // Validate file size (max 5MB)
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

               // Cleanup old ObjectURL if exists
               if (complexFormData.image && complexFormData.image.startsWith('blob:')) {
                    URL.revokeObjectURL(complexFormData.image);
               }

               setComplexImageUploading(true);
               const objectUrl = URL.createObjectURL(file);

               // Store File object for upload (not base64)
               setComplexFormData(prev => ({
                    ...prev,
                    imageFile: file, // File object to send to backend
                    imageUrl: null, // Clear existing URL when uploading new file
                    image: objectUrl // ObjectURL for preview
               }));

               setTimeout(() => setComplexImageUploading(false), 300);
          }
     };

     const handleComplexFieldChange = (field, value) => {
          setComplexFormData((prev) => ({
               ...prev,
               [field]: value,
          }));
     };

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

     const removeComplexImage = () => {
          // Cleanup ObjectURL if exists
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

     const handleComplexUploadAreaKeyDown = (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
               event.preventDefault();
               triggerComplexImagePicker();
          }
     };

     const handleComplexSubmit = async (e) => {
          e.preventDefault();
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          // Validate token and owner role before proceeding
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

          // Check if user is owner
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

          // Validate ownerId - Get UserID from Users table
          // OwnerID in FieldComplexes references Users(UserID)
          const ownerId = user?.userID || user?.UserID || user?.id || user?.userId;
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

          // Validate dữ liệu khu sân bằng validation function
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
                         const errorMessage = geocodeResult?.error || "Không lấy được tọa độ từ địa chỉ. Vui lòng chọn địa chỉ từ gợi ý hoặc chọn vị trí trên bản đồ.";
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

               const latToUse =
                    lat !== null && lat !== undefined && lat !== ""
                         ? Number.isNaN(Number(lat))
                              ? lat
                              : Number(lat)
                         : null;
               const lngToUse =
                    lng !== null && lng !== undefined && lng !== ""
                         ? Number.isNaN(Number(lng))
                              ? lng
                              : Number(lng)
                         : null;

               if (isEditingComplex) {
                    let updatePayload;

                    // Always use FormData for update to match API expectations
                    updatePayload = new FormData();
                    updatePayload.append("ComplexId", String(editingComplexId));
                    updatePayload.append("OwnerId", String(Number(ownerId)));
                    updatePayload.append("Name", complexFormData.name);
                    updatePayload.append("Address", complexFormData.address);
                    updatePayload.append("Description", complexFormData.description || "");
                    updatePayload.append("Status", complexFormData.status || "Pending");

                    // Add image file if new one is selected, otherwise keep existing
                    if (complexFormData.imageFile) {
                         updatePayload.append("ImageFile", complexFormData.imageFile);
                    } else if (complexFormData.imageUrl) {
                         // If no new file but has existing URL, we might need to send it
                         // But FormData doesn't handle URLs well, so we'll let backend handle it
                         // by not sending ImageFile field
                    }

                    // Add location data - use only one format (Lat/Lng) to avoid confusion
                    if (latToUse !== null && latToUse !== undefined) {
                         updatePayload.append("Lat", String(latToUse));
                    }
                    if (lngToUse !== null && lngToUse !== undefined) {
                         updatePayload.append("Lng", String(lngToUse));
                    }

                    // Add address components
                    if (ward) {
                         updatePayload.append("Ward", ward);
                    }
                    if (district) {
                         updatePayload.append("District", district);
                    }
                    if (province) {
                         updatePayload.append("Province", province);
                    }

                    // Add CreatedAt if available (for preserving creation date)
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

               // Create FormData if image file exists, otherwise use JSON
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
                    if (ward) {
                         formDataToSend.append("Ward", ward);
                    }
                    if (district) {
                         formDataToSend.append("District", district);
                    }
                    if (province) {
                         formDataToSend.append("Province", province);
                    }

                    newComplexResponse = await createFieldComplex(formDataToSend);
               } else {
                    // No file, create without image (or with existing imageUrl if editing)
                    // OwnerID must reference Users(UserID) from database
                    const payload = {
                         complexId: 0, // Will be set by backend
                         ownerId: Number(ownerId), // Ensure it's a number matching Users(UserID)
                         name: complexFormData.name,
                         address: complexFormData.address,
                         description: complexFormData.description || "",
                         imageUrl: complexFormData.imageUrl || "", // Send existing URL if any
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
                    if (ward) {
                         payload.ward = ward;
                    }
                    if (district) {
                         payload.district = district;
                    }
                    if (province) {
                         payload.province = province;
                    }

                    newComplexResponse = await createFieldComplex(payload);
               }

               // Handle response - API may return array or single object
               let newComplex;
               if (Array.isArray(newComplexResponse)) {
                    newComplex = newComplexResponse[0];
               } else {
                    newComplex = newComplexResponse;
               }

               // Extract only fields from API response
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

               // Add new complex to the list with only API fields
               setComplexes(prev => [...prev, normalizedComplex]);

               // Show success message
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

               // Close complex modal and reset form
               setIsAddComplexModalOpen(false);
               setIsEditComplexModalOpen(false);
               // Revoke object URL before resetting
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
               console.error(isEditingComplex ? 'Error updating complex:' : 'Error creating complex:', error);

               // Extract detailed error message from API response
               let errorMessage = `Có lỗi xảy ra khi ${actionLabel}`;
               let errorDetails = '';

               if (error.response) {
                    const { status, data } = error.response;

                    // Handle 400 Bad Request with detailed messages
                    if (status === 400) {
                         if (data) {
                              // Try to get error message from different possible fields
                              errorMessage = data.message || data.title || data.error || 'Dữ liệu không hợp lệ';

                              // Handle validation errors (ModelState errors)
                              if (data.errors && typeof data.errors === 'object') {
                                   const validationErrors = [];
                                   Object.keys(data.errors).forEach(key => {
                                        if (Array.isArray(data.errors[key])) {
                                             validationErrors.push(...data.errors[key]);
                                        } else {
                                             validationErrors.push(data.errors[key]);
                                        }
                                   });

                                   if (validationErrors.length > 0) {
                                        errorMessage = validationErrors[0]; // Show first error
                                        if (validationErrors.length > 1) {
                                             errorDetails = `Các lỗi khác: ${validationErrors.slice(1).join(', ')}`;
                                        }
                                   }
                              }

                              // Check for specific image-related errors
                              if (errorMessage.toLowerCase().includes('image') ||
                                   errorMessage.toLowerCase().includes('ảnh') ||
                                   errorMessage.toLowerCase().includes('file')) {
                                   errorMessage = 'Hình ảnh không hợp lệ. Vui lòng chọn lại hình ảnh.';
                              }
                         } else {
                              errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.';
                         }
                    } else if (status === 401) {
                         errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                    } else if (status === 403) {
                         errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
                    } else if (status === 404) {
                         errorMessage = 'Không tìm thấy tài nguyên.';
                    } else if (status === 500) {
                         errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
                    } else if (data && data.message) {
                         errorMessage = data.message;
                    }
               } else if (error.request) {
                    // Network error
                    if (error.message?.includes('CORS')) {
                         errorMessage = 'Lỗi CORS: Backend chưa cấu hình cho phép truy cập từ domain này.';
                         errorDetails = 'Vui lòng kiểm tra cấu hình CORS trên backend hoặc liên hệ admin.';
                    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                         errorMessage = 'Kết nối timeout. Vui lòng thử lại sau.';
                         errorDetails = 'Server có thể đang quá tải hoặc kết nối mạng chậm.';
                    } else {
                         errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
                    }
               } else if (error.message) {
                    errorMessage = error.message;
               }

               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    html: `<p class="font-medium">${errorMessage}</p>${errorDetails ? `<p class="text-sm mt-2 text-gray-600">${errorDetails}</p>` : ''}`,
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#ef4444'
               });
          }
     };

     const handleSubmit = async (e) => {
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

               // Validate dữ liệu sân bằng validation function
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

               // Helper to check if a value is a File object
               const isFile = (value) => {
                    return value instanceof File;
               };

               // Helper to check if a value is a URL string
               const isUrl = (value) => {
                    if (!value || typeof value !== 'string') return false;
                    return value.startsWith('http://') || value.startsWith('https://');
               };

               // Create or update field with FormData for File objects
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

               // Add bank account information
               formDataToSend.append("BankName", formData.bankName);
               formDataToSend.append("BankShortCode", formData.bankShortCode || "");
               formDataToSend.append("AccountNumber", formData.accountNumber);
               formDataToSend.append("AccountHolder", formData.accountHolder);

               // Separate new uploads (File objects) from existing images (URLs)
               const newMainImageFile = formData.mainImage && isFile(formData.mainImage) ? formData.mainImage : null;
               const existingMainImageUrl = formData.mainImage && isUrl(formData.mainImage) ? formData.mainImage : null;

               const newGalleryFiles = formData.imageFiles?.filter(img => isFile(img)) || [];
               const existingGalleryUrls = formData.imageFiles?.filter(img => isUrl(img)) || [];

               // Add main image: send File object if it's a new upload
               if (newMainImageFile) {
                    formDataToSend.append("MainImage", newMainImageFile);
               }

               // If editing and keeping existing main image URL, send it so backend knows to preserve it
               if (isEditingField && existingMainImageUrl) {
                    formDataToSend.append("MainImageUrl", existingMainImageUrl);
               }

               // Add new gallery images as File objects
               if (newGalleryFiles.length > 0) {
                    newGalleryFiles.forEach((file) => {
                         formDataToSend.append("ImageFiles", file);
                    });
               }

               // If editing and keeping existing gallery URLs, send them so backend knows to preserve them
               if (isEditingField && existingGalleryUrls.length > 0) {
                    existingGalleryUrls.forEach((url) => {
                         formDataToSend.append("ImageUrls", url);
                    });
               }

               let createdField;
               if (isEditModalOpen && formData.fieldId) {
                    formDataToSend.append("FieldId", formData.fieldId);
                    createdField = await updateField(formData.fieldId, formDataToSend);
               } else {
                    createdField = await createField(formDataToSend);
               }

               // Optionally create default field prices for all time slots
               if (timeSlots.length > 0 && formData.pricePerHour) {
                    try {
                         for (const slot of timeSlots) {
                              await createFieldPrice({
                                   fieldId: createdField.fieldId,
                                   slotId: slot.SlotID,
                                   price: parseFloat(formData.pricePerHour),
                              });
                         }
                    } catch (priceError) {
                         console.warn("Error creating field prices:", priceError);
                         // Continue even if price creation fails
                    }
               }

               // Show success message with SweetAlert2
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
               const errorDetails = error.details || "";

               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    html: `<p>${errorMessage}</p>${errorDetails ? `<p class="text-sm mt-2">${errorDetails}</p>` : ''}${error.message?.includes('CORS') ? '<p class="text-xs mt-2 text-gray-500">Vui lòng kiểm tra cấu hình CORS trên backend.</p>' : ''}`,
                    confirmButtonColor: '#ef4444'
               });
          }
     };

     const handleEdit = (field) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          const typeKey = Object.keys(fieldTypeMap).find(
               key => fieldTypeMap[key] === field.typeId
          ) || "";

          // Find matching bank account - prioritize bankAccountId, fallback to bankName + accountNumber
          let matchingAccount = null;
          if (field.bankAccountId) {
               matchingAccount = bankAccounts.find(acc =>
                    acc.bankAccountId === Number(field.bankAccountId) ||
                    acc.bankAccountId === field.bankAccountId
               );
          }
          // Fallback: find by bankName and accountNumber if bankAccountId not found
          if (!matchingAccount && field.bankName && field.accountNumber) {
               matchingAccount = bankAccounts.find(acc =>
                    acc.bankName === field.bankName &&
                    acc.accountNumber === field.accountNumber
               );
          }

          // Extract main image and gallery images from field (only URLs from Cloudinary)
          let mainImage = null;
          let galleryImages = [];

          // Only use URLs from Cloudinary
          if (field.mainImageUrl) {
               mainImage = field.mainImageUrl;
          }

          // Only use URLs from Cloudinary
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
               // Lấy thông tin bank account từ matchingAccount nếu có, fallback về field data
               bankAccountId: matchingAccount ? String(matchingAccount.bankAccountId) : (field.bankAccountId ? String(field.bankAccountId) : ""),
               bankName: matchingAccount?.bankName || field.bankName || "",
               bankShortCode: matchingAccount?.bankShortCode || field.bankShortCode || "",
               accountNumber: matchingAccount?.accountNumber || field.accountNumber || "",
               accountHolder: matchingAccount?.accountHolder || field.accountHolder || "",
          });
          setIsEditModalOpen(true);
     };

     const handleDelete = async (fieldId) => {
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
     };

     const handleAddField = (defaultComplexId = "") => {
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
                         handleAddComplex();
                    }
               });
               return;
          }
          resetForm(defaultComplexId);
          // Preselect default bank account if available
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
     };

     const handleAddComplex = () => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          resetComplexForm();
          setEditingComplexId(null);
          setIsEditComplexModalOpen(false);
          setIsAddComplexModalOpen(true);
     };

     const handleEditComplex = (complex) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          if (complexFormData.image && complexFormData.image.startsWith('blob:')) {
               URL.revokeObjectURL(complexFormData.image);
          }

          // Load complex data with imageUrl from Cloudinary
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
               // Only use imageUrl from Cloudinary
               image: complexImageUrl || "",
               imageUrl: complexImageUrl, // Store URL for backend
               imageFile: null, // No new file selected
               status: complexStatus, // Preserve current status
          });
          setEditingComplexId(complex.complexId || complex.ComplexID);
          setComplexImageUploading(false);
          if (complexImageInputRef.current) {
               complexImageInputRef.current.value = "";
          }
          setIsAddComplexModalOpen(false);
          setIsEditComplexModalOpen(true);
     };

     const handleDeleteComplex = async (complexId) => {
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
     };

     const handleToggleComplexStatus = async (complex) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          const complexId = complex.complexId || complex.ComplexID;
          const currentStatus = complex.status || "Active";
          // API expects "Deactive" not "Inactive"
          const newStatus = currentStatus === "Active" ? "Deactive" : "Active";

          // Optimistic update
          setComplexes(prevComplexes =>
               prevComplexes.map(c =>
                    (c.complexId || c.ComplexID) === complexId
                         ? { ...c, status: newStatus }
                         : c
               )
          );

          try {
               // API requires FormData format (multipart/form-data) based on API documentation
               const imageUrl = complex.imageUrl || complex.ImageUrl || complex.image || complex.Image || "";

               const updatePayload = new FormData();
               updatePayload.append("ComplexId", String(complexId));
               updatePayload.append("OwnerId", String(complex.ownerId || complex.OwnerID));
               updatePayload.append("Name", complex.name || complex.Name);
               updatePayload.append("Address", complex.address || complex.Address);
               updatePayload.append("Description", complex.description || complex.Description || "");
               updatePayload.append("Status", newStatus);
               updatePayload.append("CreatedAt", complex.createdAt || complex.CreatedAt || "");

               // Try to fetch and include existing image as File object
               // This ensures API receives ImageFile field which it might require
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
                         console.warn('Could not fetch image for FormData:', fetchError);
                         // Continue without ImageFile - backend might preserve existing image
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

               // Reload data to ensure UI is in sync
               await loadData();

               await Swal.fire({
                    icon: 'success',
                    title: newStatus === "Active" ? 'Đã kích hoạt thành công!' : 'Đã vô hiệu hóa thành công!',
                    html: `
                         <div class="text-center">
                              <p class="text-lg font-semibold text-gray-800 mb-2">
                                   Khu sân: <span class="text-blue-600">"${complex.name || complex.Name}"</span>
                              </p>
                              <p class="text-gray-600">
                                   Trạng thái đã được thay đổi thành <strong class="text-green-600">${newStatus === "Active" ? "Đang hoạt động" : "Đã vô hiệu hóa"}</strong>
                              </p>
                         </div>
                    `,
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#10b981',
                    timer: 3000,
                    showConfirmButton: true,
                    allowOutsideClick: true
               });
          } catch (error) {
               // Revert optimistic update on error
               setComplexes(prevComplexes =>
                    prevComplexes.map(c =>
                         (c.complexId || c.ComplexID) === complexId
                              ? { ...c, status: currentStatus }
                              : c
                    )
               );

               console.error('Error toggling complex status:', error);
               console.error('Error details:', {
                    complexId,
                    currentStatus,
                    newStatus,
                    complex: complex
               });

               const errorMessage = error.message || error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái khu sân';
               const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : '';

               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    html: `<p>${errorMessage}</p>${errorDetails ? `<p class="text-xs mt-2 text-gray-500">Chi tiết: ${errorDetails}</p>` : ''}`,
                    confirmButtonColor: '#ef4444'
               });
          }
     };

     const resetComplexForm = () => {
          // Revoke object URL if exists to prevent memory leak
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
               status: "Active", // Reset to default
          });
          setComplexImageUploading(false);
          if (complexImageInputRef.current) {
               complexImageInputRef.current.value = "";
          }
     };

     const handleCloseFieldModal = () => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          resetForm();
     };

     const handleCloseComplexModal = () => {
          setIsAddComplexModalOpen(false);
          setIsEditComplexModalOpen(false);
          setEditingComplexId(null);
          resetComplexForm();
     };

     const handleRequestCreateComplex = () => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          handleAddComplex();
     };

     const handleNavigateBankAccounts = () => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          resetForm();
          window.location.href = '/owner/bank-accounts';
     };

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

               // Check for API error response
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

     // Handle address selection from AddressPicker for complex
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

     const getStatusColor = (status) => {
          switch (status) {
               case 'Available': return 'bg-green-100 text-green-800';
               case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
               case 'Unavailable': return 'bg-red-100 text-red-800';
               default: return 'bg-gray-100 text-gray-800';
          }
     };

     const getStatusText = (status) => {
          const statusObj = fieldStatuses.find(s => s.value === status);
          return statusObj ? statusObj.label : status;
     };

     const formatCurrency = (amount) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(amount);
     };

     // Pagination for complexes (4 per page)
     const {
          currentPage: complexesPage,
          totalPages: complexesTotalPages,
          currentItems: paginatedComplexes,
          handlePageChange: handleComplexesPageChange,
          totalItems: complexesTotalItems,
          itemsPerPage: complexesPerPage,
     } = usePagination(complexes, 4);

     // Lọc chỉ hiển thị sân nhỏ của khu sân đã được duyệt (Active)
     const activeFields = useMemo(() => {
          return fields.filter(field => field.complexStatus === "Active");
     }, [fields]);

     // Pagination for fields (6 per page) - chỉ hiển thị sân của khu sân Active
     const {
          currentPage: fieldsPage,
          totalPages: fieldsTotalPages,
          currentItems: paginatedFields,
          handlePageChange: handleFieldsPageChange,
          totalItems: fieldsTotalItems,
          itemsPerPage: fieldsPerPage,
     } = usePagination(activeFields, 6);

     if (loading) {
          return (
               <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    <span className="ml-2 text-gray-600">Đang tải...</span>
               </div>
          );
     }

     return (
          <div className="space-y-8">
               {/* Header */}
               <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                         <h1 className="text-3xl font-bold text-gray-900">Quản lý sân</h1>
                         <p className="text-gray-600 mt-1">Theo dõi khu sân và các sân nhỏ trong hệ thống của bạn</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                         <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-medium">
                              Khu sân: {complexes.length}
                         </span>
                         <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-600 border border-teal-200 font-medium">
                              Sân nhỏ: {activeFields.length}
                         </span>
                         {fields.length > activeFields.length && (
                              <span className="px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200 font-medium">
                                   Chờ duyệt: {fields.length - activeFields.length} sân
                              </span>
                         )}
                    </div>
               </div>

               {/* Complexes Section */}
               <section className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-3xl shadow-sm p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                         <div>
                              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                                   <Building2 className="w-6 h-6 text-blue-500" />
                                   Khu sân
                              </h2>
                              <p className="text-sm text-gray-500 mt-1">Quản lý danh sách khu sân và thông tin tổng quan</p>
                         </div>
                         <Button
                              onClick={handleAddComplex}
                              variant="outline"
                              className="flex items-center space-x-2 rounded-2xl border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-600"
                         >
                              <Plus className="w-4 h-4" />
                              <span>Thêm khu sân</span>
                         </Button>
                    </div>

                    {complexes.length === 0 ? (
                         <Card className="p-10 text-center border-dashed border-2 border-blue-200 bg-blue-50/50 rounded-2xl">
                              <Building2 className="w-12 h-12 mx-auto text-blue-400 mb-3" />
                              <p className="text-gray-500 mb-4">Chưa có khu sân nào. Hãy tạo khu sân đầu tiên để quản lý sân nhỏ.</p>
                              <Button onClick={handleAddComplex}>
                                   <Plus className="w-4 h-4 mr-2" />
                                   Thêm khu sân mới
                              </Button>
                         </Card>
                    ) : (
                         <>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                   {paginatedComplexes.map((complex) => {
                                        const fieldCount = complexFieldCounts[complex.complexId] || 0;
                                        return (
                                             <Card key={complex.complexId} className={`h-full border rounded-2xl hover:shadow-lg transition-all duration-300 ${complex.status === "Active"
                                                  ? "border-blue-100 bg-white"
                                                  : complex.status === "Pending"
                                                       ? "border-yellow-200 bg-yellow-50/30"
                                                       : complex.status === "Rejected"
                                                            ? "border-red-200 bg-red-50/30 opacity-75"
                                                            : "border-gray-200 bg-gray-50/50 opacity-75"
                                                  }`}>
                                                  <div className="p-4 space-y-4">
                                                       <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                 <h3 className={`text-xl font-bold line-clamp-1 ${complex.status === "Active"
                                                                      ? "text-gray-900"
                                                                      : complex.status === "Pending"
                                                                           ? "text-yellow-800"
                                                                           : complex.status === "Rejected"
                                                                                ? "text-red-800"
                                                                                : "text-gray-500"
                                                                      }`}>
                                                                      {complex.name}
                                                                 </h3>
                                                                 <p className="text-xs text-gray-500 mt-1">
                                                                      Tạo ngày: {complex.createdAt ? new Date(complex.createdAt).toLocaleDateString("vi-VN") : "-"}
                                                                 </p>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 ml-2">
                                                                 {/* Chỉ hiển thị nút toggle khi status là Active hoặc Deactive */}
                                                                 {(complex.status === "Active" || complex.status === "Deactive") && (
                                                                      <button
                                                                           type="button"
                                                                           onClick={() => handleToggleComplexStatus(complex)}
                                                                           className={`p-1.5 rounded-lg transition-all duration-200 ${complex.status === "Active"
                                                                                ? "bg-green-100 text-green-600 hover:bg-green-200"
                                                                                : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                                                                                }`}
                                                                           title={complex.status === "Active" ? "Vô hiệu hóa" : "Kích hoạt"}
                                                                      >
                                                                           {complex.status === "Active" ? (
                                                                                <Power className="w-4 h-4" />
                                                                           ) : (
                                                                                <PowerOff className="w-4 h-4" />
                                                                           )}
                                                                      </button>
                                                                 )}
                                                                 {/* Chỉ cho phép chỉnh sửa khi không phải Pending */}
                                                                 {complex.status !== "Pending" && (
                                                                      <button
                                                                           type="button"
                                                                           onClick={() => handleEditComplex(complex)}
                                                                           className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors"
                                                                           title="Chỉnh sửa"
                                                                      >
                                                                           <Edit className="w-4 h-4" />
                                                                      </button>
                                                                 )}
                                                                 <button
                                                                      type="button"
                                                                      onClick={() => handleDeleteComplex(complex.complexId || complex.ComplexID)}
                                                                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                                                      title="Xóa"
                                                                 >
                                                                      <Trash2 className="w-4 h-4" />
                                                                 </button>
                                                            </div>
                                                       </div>
                                                       <div className="flex items-center gap-2">
                                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${complex.status === "Active"
                                                                 ? "bg-green-50 text-green-700 border-green-200"
                                                                 : complex.status === "Pending"
                                                                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                                      : complex.status === "Rejected"
                                                                           ? "bg-red-50 text-red-700 border-red-200"
                                                                           : "bg-gray-100 text-gray-600 border-gray-300"
                                                                 }`}>
                                                                 {complex.status === "Active"
                                                                      ? "Đang hoạt động"
                                                                      : complex.status === "Pending"
                                                                           ? "Chờ duyệt"
                                                                           : complex.status === "Rejected"
                                                                                ? "Đã bị từ chối"
                                                                                : complex.status === "Deactive"
                                                                                     ? "Đã vô hiệu hóa"
                                                                                     : "Đã vô hiệu hóa"}
                                                            </span>
                                                       </div>
                                                       {complex.address && (
                                                            <div className="flex items-start border border-blue-200 rounded-2xl p-1 gap-2 text-xs text-gray-600">
                                                                 <MapPin className="w-4 h-4 mt-0.5 text-blue-400" />
                                                                 <span className="line-clamp-2 font-medium">{complex.address}</span>
                                                            </div>
                                                       )}
                                                       {complex.description && (
                                                            <p className="text-sm text-gray-500 line-clamp-2">{complex.description}</p>
                                                       )}
                                                       <div className="flex items-center gap-2 text-xs">
                                                            <span className="px-2 py-1 rounded-full bg-teal-50 text-teal-600 border border-teal-200">
                                                                 {fieldCount} sân nhỏ
                                                            </span>
                                                            {complex.ownerName && (
                                                                 <span className="px-2 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                                                                      Chủ sở hữu: {complex.ownerName}
                                                                 </span>
                                                            )}
                                                       </div>
                                                       <div className="flex justify-end">
                                                            {complex.status === "Active" ? (
                                                                 <Button
                                                                      variant="outline"
                                                                      size="sm"
                                                                      className="text-teal-600 border-teal-200 hover:text-teal-600 hover:bg-teal-50 rounded-full"
                                                                      onClick={() => handleAddField(complex.complexId)}
                                                                 >
                                                                      <Plus className="w-4 h-4 mr-1" />
                                                                      Thêm sân nhỏ
                                                                 </Button>
                                                            ) : complex.status === "Pending" ? (
                                                                 <span className="text-xs text-yellow-600 italic">
                                                                      Đang chờ Admin duyệt
                                                                 </span>
                                                            ) : complex.status === "Rejected" ? (
                                                                 <span className="text-xs text-red-600 italic">
                                                                      Khu sân đã bị từ chối
                                                                 </span>
                                                            ) : null}
                                                       </div>
                                                  </div>
                                             </Card>
                                        );
                                   })}
                              </div>
                              <Pagination
                                   currentPage={complexesPage}
                                   totalPages={complexesTotalPages}
                                   onPageChange={handleComplexesPageChange}
                                   itemsPerPage={complexesPerPage}
                                   totalItems={complexesTotalItems}
                              />
                         </>
                    )}
               </section>

               {/* Fields Section */}
               <section className="bg-white/90 backdrop-blur-sm border border-teal-200/60 rounded-3xl shadow-sm p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                         <div>
                              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                                   <MapPin className="w-6 h-6 text-teal-500" />
                                   Sân nhỏ
                              </h2>
                              <p className="text-sm text-gray-500 mt-1">Danh sách các sân trong mỗi khu sân</p>
                         </div>
                         <Button
                              onClick={() => handleAddField()}
                              className="flex items-center space-x-2 rounded-2xl"
                         >
                              <Plus className="w-4 h-4" />
                              <span>Thêm sân mới</span>
                         </Button>
                    </div>

                    {/* Thông báo sân đang chờ duyệt */}
                    {fields.length > activeFields.length && (
                         <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
                              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                   <Building2 className="w-5 h-5 text-yellow-600" />
                              </div>
                              <div>
                                   <p className="text-yellow-800 font-medium">
                                        Có {fields.length - activeFields.length} sân nhỏ đang chờ duyệt
                                   </p>
                                   <p className="text-yellow-600 text-sm">
                                        Các sân thuộc khu sân chưa được Admin duyệt sẽ không hiển thị cho người chơi
                                   </p>
                              </div>
                         </div>
                    )}

                    {activeFields.length === 0 ? (
                         <Card className="p-12 text-center border-dashed border-2 border-teal-200 bg-teal-50/50 rounded-2xl">
                              <p className="text-gray-500 mb-4">
                                   {fields.length > 0
                                        ? "Tất cả sân đang chờ Admin duyệt khu sân"
                                        : "Chưa có sân nào. Hãy tạo sân đầu tiên!"}
                              </p>
                              {fields.length === 0 && (
                                   <Button onClick={() => handleAddField()}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Thêm sân mới
                                   </Button>
                              )}
                         </Card>
                    ) : (
                         <>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                   {paginatedFields.map((field) => {
                                        // Only use mainImageUrl from Cloudinary
                                        const primaryImage =
                                             field.mainImageUrl ||
                                             (Array.isArray(field.images) && field.images.length > 0
                                                  ? field.images[0]
                                                  : null);
                                        return (
                                             <Card
                                                  key={field.fieldId}
                                                  className="group overflow-hidden rounded-3xl border border-teal-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                                             >
                                                  <div className="relative">
                                                       <div
                                                            className="h-48 w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                                                            style={
                                                                 primaryImage
                                                                      ? {
                                                                           backgroundImage: `url(${primaryImage})`,
                                                                      }
                                                                      : undefined
                                                            }
                                                       >
                                                            {!primaryImage && (
                                                                 <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                                                                      {field.name}
                                                                 </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                                                            <div className="absolute top-4 left-4">
                                                                 <span className="text-white/90 text-xs font-medium px-2 py-1 rounded-full bg-white/20 backdrop-blur">
                                                                      {field.complexName}
                                                                 </span>
                                                            </div>
                                                            <div className="absolute top-4 right-4">
                                                                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(field.status)}`}>
                                                                      {getStatusText(field.status)}
                                                                 </span>
                                                            </div>
                                                            <div className="absolute bottom-3 left-4 text-white drop-shadow-sm">
                                                                 <h3 className="text-xl font-semibold">{field.name}</h3>
                                                                 <p className="text-xs text-white/80 mt-1">
                                                                      {field.typeName || `Type ID: ${field.typeId}`}
                                                                 </p>
                                                            </div>
                                                       </div>
                                                  </div>

                                                  <div className="p-6 space-y-3">
                                                       <div className="flex items-start justify-between">
                                                            <div className="space-y-1">
                                                                 {field.size && (
                                                                      <p className="text-sm text-gray-600">
                                                                           Kích thước: {field.size}
                                                                      </p>
                                                                 )}
                                                                 {field.complexAddress && (
                                                                      <div className="flex items-center text-xs text-gray-500">
                                                                           <MapPin className="w-4 h-4 mr-1 text-teal-500" />
                                                                           <span className="line-clamp-1">{field.complexAddress}</span>
                                                                      </div>
                                                                 )}
                                                            </div>
                                                            <div className="flex space-x-2">
                                                                 <Button
                                                                      variant="outline"
                                                                      size="sm"
                                                                      className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 transition-all duration-300 ease-in-out rounded-full hover:scale-105"
                                                                      onClick={() => handleEdit(field)}
                                                                 >
                                                                      <Edit className="w-4 h-4" />
                                                                 </Button>
                                                                 <Button
                                                                      variant="outline"
                                                                      size="sm"
                                                                      onClick={() => handleDelete(field.fieldId)}
                                                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-all duration-300 ease-in-out rounded-full hover:scale-105"
                                                                 >
                                                                      <Trash2 className="w-4 h-4" />
                                                                 </Button>
                                                            </div>
                                                       </div>

                                                       <div className="flex items-center font-bold text-lg text-red-500">
                                                            <DollarSign className="w-4 h-4 mr-1" />
                                                            <span>
                                                                 {field.pricePerHour > 0
                                                                      ? `${formatCurrency(field.pricePerHour)}/giờ`
                                                                      : "Chưa cập nhật giá"}
                                                            </span>
                                                       </div>

                                                       {field.description && (
                                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                                 {field.description}
                                                            </p>
                                                       )}
                                                  </div>
                                             </Card>
                                        )
                                   })}
                              </div>
                              <Pagination
                                   currentPage={fieldsPage}
                                   totalPages={fieldsTotalPages}
                                   onPageChange={handleFieldsPageChange}
                                   itemsPerPage={fieldsPerPage}
                                   totalItems={fieldsTotalItems}
                              />
                         </>
                    )}
               </section>

               <FieldFormModal
                    isOpen={isAddModalOpen || isEditModalOpen}
                    isEdit={isEditModalOpen}
                    complexes={complexes}
                    formData={formData}
                    fieldTypes={fieldTypes}
                    fieldStatuses={fieldStatuses}
                    bankAccounts={bankAccounts}
                    onClose={handleCloseFieldModal}
                    onSubmit={handleSubmit}
                    onInputChange={handleInputChange}
                    onSelectType={(value) => setFormData(prev => ({ ...prev, typeId: value }))}
                    onSelectStatus={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    onMainImageChange={handleMainImageChange}
                    onImageFilesChange={handleImageFilesChange}
                    onAddComplex={handleRequestCreateComplex}
                    onBankAccountChange={handleBankAccountChange}
                    onNavigateBankAccounts={handleNavigateBankAccounts}
                    maxImages={MAX_FIELD_IMAGES}
               />

               <ComplexFormModal
                    isOpen={isAddComplexModalOpen || isEditComplexModalOpen}
                    isEdit={isEditComplexModalOpen}
                    formData={complexFormData}
                    isUploadingImage={complexImageUploading}
                    imageInputRef={complexImageInputRef}
                    onClose={handleCloseComplexModal}
                    onSubmit={handleComplexSubmit}
                    onFieldChange={handleComplexFieldChange}
                    onAddressChange={(address) => handleComplexFieldChange("address", address)}
                    onLocationSelect={handleComplexAddressSelect}
                    onTriggerImagePicker={triggerComplexImagePicker}
                    onUploadAreaKeyDown={handleComplexUploadAreaKeyDown}
                    onImageUpload={handleComplexImageUpload}
                    onRemoveImage={removeComplexImage}
               />

               {/* Demo Restricted Modal */}
               <DemoRestrictedModal
                    isOpen={showDemoRestrictedModal}
                    onClose={() => setShowDemoRestrictedModal(false)}
                    featureName="Quản lý sân"
               />
          </div>
     );
};

export default FieldManagement;
