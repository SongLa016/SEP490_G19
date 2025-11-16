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
import { Button, Card } from "../../../shared/components/ui";
import OwnerLayout from "../layouts/OwnerLayout";
import { DemoRestrictedModal } from "../../../shared";
import {
     createField,
     createFieldComplex,
     updateField,
     deleteField,
     fetchAllComplexesWithFields,
     createFieldPrice,
     updateFieldComplex,
     deleteFieldComplex
} from "../../../shared/services/fields";
import { fetchTimeSlots } from "../../../shared/services/timeSlots";
import { fetchOwnerBankAccounts } from "../../../shared/services/ownerBankAccount";
import FieldFormModal from "./components/fieldManagement/FieldFormModal";
import ComplexFormModal from "./components/fieldManagement/ComplexFormModal";
import { useAuth } from "../../../contexts/AuthContext";

const MAX_FIELD_IMAGES = 4;

const FieldManagement = ({ isDemo = false }) => {
     const { user, logout } = useAuth();
     const [isAddModalOpen, setIsAddModalOpen] = useState(false);
     const [isEditModalOpen, setIsEditModalOpen] = useState(false);
     const [isAddComplexModalOpen, setIsAddComplexModalOpen] = useState(false);
     const [isEditComplexModalOpen, setIsEditComplexModalOpen] = useState(false);
     const [editingComplexId, setEditingComplexId] = useState(null);
     const [complexImageUploading, setComplexImageUploading] = useState(false);
     const complexImageInputRef = useRef(null);
     const [fieldImageUploading, setFieldImageUploading] = useState(false);
     const fieldImageInputRef = useRef(null);
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
          description: "",
          image: "",
          imageFile: null,
     });
     const [formData, setFormData] = useState({
          complexId: "",
          name: "",
          typeId: "",
          size: "",
          grassType: "",
          description: "",
          images: [],
          imageFiles: [],
          pricePerHour: "",
          status: "Available",
          bankAccountId: "",
          bankName: "",
          bankShortCode: "",
          accountNumber: "",
          accountHolder: "",
     });

     // Map field types
     const fieldTypeMap = {
          "5vs5": 1,
          "7vs7": 2,
          "11vs11": 3,
     };

     const fieldTypes = [
          { value: "5vs5", label: "Sân 5 người", typeId: 1 },
          { value: "7vs7", label: "Sân 7 người", typeId: 2 },
          { value: "11vs11", label: "Sân 11 người", typeId: 3 },
     ];

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
                              image: complex.image || null,
                              status: complex.status,
                              createdAt: complex.createdAt,
                              ownerName: complex.ownerName || null,
                              fields: complex.fields || [],
                              fieldCount: complex.fieldCount || 0
                         }));
                    setComplexes(ownerComplexes);

                    // Tạo danh sách tất cả các sân nhỏ từ các khu sân
                    const allFields = [];
                    for (const complex of ownerComplexes) {
                         // Fields đã được lấy sẵn trong complex.fields
                         allFields.push(...(complex.fields || []).map(f => ({
                              ...f,
                              complexName: complex.name,
                              complexAddress: complex.address,
                         })));
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
     }, [currentUserId, isDemo]);

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

     const handleFieldImageUpload = (e) => {
          const files = Array.from(e.target.files || []);
          if (!files.length) {
               return;
          }

          let added = false;
          let limitReached = false;
          let newImages = [...formData.images];
          let newImageFiles = [...formData.imageFiles];

          const remainingSlots = MAX_FIELD_IMAGES - newImageFiles.length;
          if (remainingSlots <= 0) {
               Swal.fire({
                    icon: 'info',
                    title: 'Đạt giới hạn ảnh',
                    text: `Mỗi sân chỉ được chọn tối đa ${MAX_FIELD_IMAGES} ảnh.`,
                    confirmButtonColor: '#3b82f6'
               });
               return;
          }

          setFieldImageUploading(true);

          for (const file of files) {
               if (newImageFiles.length >= MAX_FIELD_IMAGES) {
                    limitReached = true;
                    break;
               }

               if (!file.type.startsWith('image/')) {
                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: `${file.name} không phải là file ảnh hợp lệ.`,
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#ef4444'
                    });
                    continue;
               }

               if (file.size > 5 * 1024 * 1024) {
                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: `${file.name} vượt quá dung lượng 5MB.`,
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#ef4444'
                    });
                    continue;
               }

               const objectUrl = URL.createObjectURL(file);
               newImages.push(objectUrl);
               newImageFiles.push(file);
               added = true;
          }

          if (added) {
               setFormData((prev) => ({
                    ...prev,
                    images: newImages,
                    imageFiles: newImageFiles,
               }));
          }

          setTimeout(() => setFieldImageUploading(false), 200);
          if (limitReached) {
               Swal.fire({
                    icon: 'info',
                    title: 'Đạt giới hạn ảnh',
                    text: `Mỗi sân chỉ được chọn tối đa ${MAX_FIELD_IMAGES} ảnh.`,
                    confirmButtonColor: '#3b82f6'
               });
          }
          if (fieldImageInputRef.current) {
               fieldImageInputRef.current.value = "";
          }
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

               if (complexFormData.image && complexFormData.image.startsWith('blob:')) {
                    URL.revokeObjectURL(complexFormData.image);
               }

               setComplexImageUploading(true);
               const objectUrl = URL.createObjectURL(file);

               // Store file for upload
               setComplexFormData(prev => ({
                    ...prev,
                    imageFile: file,
                    image: objectUrl // For preview
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
          if (complexFormData.image && complexFormData.image.startsWith('blob:')) {
               URL.revokeObjectURL(complexFormData.image);
          }
          setComplexFormData(prev => ({
               ...prev,
               image: "",
               imageFile: null,
          }));
          if (complexImageInputRef.current) {
               complexImageInputRef.current.value = "";
          }
     };

     const triggerFieldImagePicker = () => {
          fieldImageInputRef.current?.click();
     };

     const handleFieldUploadAreaKeyDown = (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
               event.preventDefault();
               triggerFieldImagePicker();
          }
     };

     const removeFieldImage = (index) => {
          setFormData((prev) => {
               const images = [...(prev.images || [])];
               const imageFiles = [...(prev.imageFiles || [])];

               const removedUrl = images[index];
               if (removedUrl && removedUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(removedUrl);
               }
               images.splice(index, 1);
               if (index < imageFiles.length) {
                    imageFiles.splice(index, 1);
               }

               return {
                    ...prev,
                    images,
                    imageFiles,
               };
          });
          setFieldImageUploading(false);
          if (fieldImageInputRef.current) {
               fieldImageInputRef.current.value = "";
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

          try {
               if (isEditingComplex) {
                    let updatePayload;

                    if (complexFormData.imageFile) {
                         updatePayload = new FormData();
                         updatePayload.append("ComplexId", String(editingComplexId));
                         updatePayload.append("OwnerId", String(Number(ownerId)));
                         updatePayload.append("Name", complexFormData.name);
                         updatePayload.append("Address", complexFormData.address);
                         updatePayload.append("Description", complexFormData.description || "");
                         updatePayload.append("Status", "Active");
                         updatePayload.append("ImageFile", complexFormData.imageFile);
                         if (complexFormData.lat !== null && complexFormData.lat !== undefined) {
                              updatePayload.append("Lat", String(complexFormData.lat));
                         }
                         if (complexFormData.lng !== null && complexFormData.lng !== undefined) {
                              updatePayload.append("Lng", String(complexFormData.lng));
                         }
                    } else {
                         updatePayload = {
                              complexId: editingComplexId,
                              ownerId: Number(ownerId),
                              name: complexFormData.name,
                              address: complexFormData.address,
                              description: complexFormData.description || "",
                              image: complexFormData.image || "",
                              status: "Active",
                         };

                         if (complexFormData.lat !== null && complexFormData.lat !== undefined) {
                              updatePayload.lat = complexFormData.lat;
                         }
                         if (complexFormData.lng !== null && complexFormData.lng !== undefined) {
                              updatePayload.lng = complexFormData.lng;
                         }
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
                    formDataToSend.append("Status", "Active");
                    formDataToSend.append("ImageFile", complexFormData.imageFile);
                    if (complexFormData.lat !== null && complexFormData.lat !== undefined) {
                         formDataToSend.append("Lat", String(complexFormData.lat));
                    }
                    if (complexFormData.lng !== null && complexFormData.lng !== undefined) {
                         formDataToSend.append("Lng", String(complexFormData.lng));
                    }

                    newComplexResponse = await createFieldComplex(formDataToSend);
               } else {
                    // OwnerID must reference Users(UserID) from database
                    const payload = {
                         complexId: 0, // Will be set by backend
                         ownerId: Number(ownerId), // Ensure it's a number matching Users(UserID)
                         name: complexFormData.name,
                         address: complexFormData.address,
                         description: complexFormData.description || "",
                         image: complexFormData.image || "",
                         status: "Active",
                    };

                    if (complexFormData.lat !== null && complexFormData.lat !== undefined) {
                         payload.lat = complexFormData.lat;
                    }
                    if (complexFormData.lng !== null && complexFormData.lng !== undefined) {
                         payload.lng = complexFormData.lng;
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
               const errorMessage = error.message || `Có lỗi xảy ra khi ${actionLabel}`;

               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    html: `<p>${errorMessage}</p>${error.message?.includes('CORS') ? '<p class="text-xs mt-2 text-gray-500">Vui lòng kiểm tra cấu hình CORS trên backend.</p>' : ''}`,
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
               if (!formData.complexId) {
                    await Swal.fire({
                         icon: 'warning',
                         title: 'Chưa chọn khu sân!',
                         text: 'Vui lòng chọn khu sân để thêm sân vào.',
                         confirmButtonColor: '#f59e0b'
                    });
                    return;
               }

               const isEditingField = Boolean(isEditModalOpen && formData.fieldId);
               const totalImagesSelected = formData.images?.length || 0;
               const hasUploadedFiles = formData.imageFiles?.length > 0;

               if (!isEditingField && !hasUploadedFiles) {
                    await Swal.fire({
                         icon: 'warning',
                         title: 'Thiếu hình ảnh!',
                         text: 'Sân mới cần ít nhất một hình ảnh (tối đa 4).',
                         confirmButtonColor: '#f59e0b'
                    });
                    return;
               }
               if (totalImagesSelected === 0) {
                    await Swal.fire({
                         icon: 'warning',
                         title: 'Chưa chọn hình ảnh!',
                         text: 'Vui lòng chọn ít nhất một hình ảnh cho sân.',
                         confirmButtonColor: '#f59e0b'
                    });
                    return;
               }

               // Validate bank account selection
               if (!formData.bankAccountId) {
                    await Swal.fire({
                         icon: 'warning',
                         title: 'Chưa chọn tài khoản ngân hàng!',
                         text: 'Vui lòng chọn tài khoản ngân hàng để nhận thanh toán.',
                         confirmButtonColor: '#f59e0b'
                    });
                    return;
               }

               // Create or update field with FormData for file upload
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

               // Add image files if exists
               if (formData.imageFiles?.length) {
                    formData.imageFiles.forEach((file, index) => {
                         // Preserve backward compatibility with single ImageFile parameter
                         if (index === 0) {
                              formDataToSend.append("ImageFile", file);
                         }
                         formDataToSend.append("ImageFiles", file);
                    });
               }

               console.log("Submitting field payload:", Array.from(formDataToSend.entries()));

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

          // Find matching bank account if exists
          const matchingAccount = bankAccounts.find(acc =>
               acc.bankName === field.bankName &&
               acc.accountNumber === field.accountNumber
          );

          const existingImages = Array.isArray(field.images)
               ? field.images.filter(Boolean).slice(0, MAX_FIELD_IMAGES)
               : field.image
                    ? [field.image]
                    : [];

          setFormData({
               fieldId: field.fieldId,
               complexId: field.complexId,
               name: field.name,
               typeId: typeKey,
               size: field.size || "",
               grassType: field.grassType || "",
               description: field.description || "",
               images: existingImages,
               imageFiles: [],
               pricePerHour: field.pricePerHour || "",
               status: field.status || "Available",
               bankAccountId: matchingAccount ? String(matchingAccount.bankAccountId) : "",
               bankName: field.bankName || "",
               bankShortCode: field.bankShortCode || "",
               accountNumber: field.accountNumber || "",
               accountHolder: field.accountHolder || "",
          });
          setFieldImageUploading(false);
          if (fieldImageInputRef.current) {
               fieldImageInputRef.current.value = "";
          }
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

          setComplexFormData({
               name: complex.name || "",
               address: complex.address || "",
               lat: complex.lat ?? complex.Lat ?? null,
               lng: complex.lng ?? complex.Lng ?? null,
               description: complex.description || complex.Description || "",
               image: complex.image || complex.Image || "",
               imageFile: null,
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
          const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

          // Optimistic update
          setComplexes(prevComplexes =>
               prevComplexes.map(c =>
                    (c.complexId || c.ComplexID) === complexId
                         ? { ...c, status: newStatus }
                         : c
               )
          );

          try {
               const updatePayload = {
                    complexId: complexId,
                    ownerId: complex.ownerId || complex.OwnerID,
                    name: complex.name || complex.Name,
                    address: complex.address || complex.Address,
                    description: complex.description || complex.Description || "",
                    image: complex.image || complex.Image || "",
                    status: newStatus,
               };

               if (complex.lat !== null && complex.lat !== undefined) {
                    updatePayload.lat = complex.lat || complex.Lat;
               }
               if (complex.lng !== null && complex.lng !== undefined) {
                    updatePayload.lng = complex.lng || complex.Lng;
               }

               await updateFieldComplex(complexId, updatePayload);

               await Swal.fire({
                    icon: 'success',
                    title: newStatus === "Active" ? 'Đã kích hoạt!' : 'Đã vô hiệu hóa!',
                    text: `Khu sân "${complex.name || complex.Name}" đã được ${newStatus === "Active" ? "kích hoạt" : "vô hiệu hóa"}.`,
                    confirmButtonColor: '#10b981',
                    timer: 2000,
                    showConfirmButton: false
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
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: error.message || 'Có lỗi xảy ra khi cập nhật trạng thái khu sân',
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
               description: "",
               image: "",
               imageFile: null,
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
          setFormData(prev => {
               (prev.images || []).forEach((url) => {
                    if (typeof url === "string" && url.startsWith('blob:')) {
                         URL.revokeObjectURL(url);
                    }
               });
               return {
                    complexId: defaultComplexId || "",
                    name: "",
                    typeId: "",
                    size: "",
                    grassType: "",
                    description: "",
                    images: [],
                    imageFiles: [],
                    pricePerHour: "",
                    status: "Available",
                    bankAccountId: "",
                    bankName: "",
                    bankShortCode: "",
                    accountNumber: "",
                    accountHolder: "",
               };
          });
          setFieldImageUploading(false);
          if (fieldImageInputRef.current) {
               fieldImageInputRef.current.value = "";
          }
     };

     // Handle address selection from AddressPicker for complex
     const handleComplexAddressSelect = (locationData) => {
          setComplexFormData(prev => ({
               ...prev,
               address: locationData.address,
               lat: locationData.lat,
               lng: locationData.lng,
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
                                   Sân nhỏ: {fields.length}
                              </span>
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
                                   className="flex items-center space-x-2 rounded-2xl border-blue-200 text-blue-600 hover:bg-blue-50"
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
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                   {complexes.map((complex) => {
                                        const fieldCount = complexFieldCounts[complex.complexId] || 0;
                                        return (
                                             <Card key={complex.complexId} className={`h-full border rounded-2xl hover:shadow-lg transition-all duration-300 ${(complex.status || "Active") === "Active"
                                                  ? "border-blue-100 bg-white"
                                                  : "border-gray-200 bg-gray-50/50 opacity-75"
                                                  }`}>
                                                  <div className="p-4 space-y-4">
                                                       <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                 <h3 className={`text-xl font-bold line-clamp-1 ${(complex.status || "Active") === "Active"
                                                                      ? "text-gray-900"
                                                                      : "text-gray-500"
                                                                      }`}>
                                                                      {complex.name}
                                                                 </h3>
                                                                 <p className="text-xs text-gray-500 mt-1">
                                                                      Tạo ngày: {complex.createdAt ? new Date(complex.createdAt).toLocaleDateString("vi-VN") : "-"}
                                                                 </p>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 ml-2">
                                                                 <button
                                                                      type="button"
                                                                      onClick={() => handleToggleComplexStatus(complex)}
                                                                      className={`p-1.5 rounded-lg transition-all duration-200 ${(complex.status || "Active") === "Active"
                                                                           ? "bg-green-100 text-green-600 hover:bg-green-200"
                                                                           : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                                                                           }`}
                                                                      title={(complex.status || "Active") === "Active" ? "Vô hiệu hóa" : "Kích hoạt"}
                                                                 >
                                                                      {(complex.status || "Active") === "Active" ? (
                                                                           <Power className="w-4 h-4" />
                                                                      ) : (
                                                                           <PowerOff className="w-4 h-4" />
                                                                      )}
                                                                 </button>
                                                                 <button
                                                                      type="button"
                                                                      onClick={() => handleEditComplex(complex)}
                                                                      className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors"
                                                                      title="Chỉnh sửa"
                                                                 >
                                                                      <Edit className="w-4 h-4" />
                                                                 </button>
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
                                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${(complex.status || "Active") === "Active"
                                                                 ? "bg-green-50 text-green-700 border-green-200"
                                                                 : "bg-gray-100 text-gray-600 border-gray-300"
                                                                 }`}>
                                                                 {(complex.status || "Active") === "Active" ? "Đang hoạt động" : "Đã vô hiệu hóa"}
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
                                                            <Button
                                                                 variant="outline"
                                                                 size="sm"
                                                                 className="text-teal-600 border-teal-200 hover:bg-teal-50 rounded-full"
                                                                 onClick={() => handleAddField(complex.complexId)}
                                                            >
                                                                 <Plus className="w-4 h-4 mr-1" />
                                                                 Thêm sân nhỏ
                                                            </Button>
                                                       </div>
                                                  </div>
                                             </Card>
                                        );
                                   })}
                              </div>
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

                         {fields.length === 0 ? (
                              <Card className="p-12 text-center border-dashed border-2 border-teal-200 bg-teal-50/50 rounded-2xl">
                                   <p className="text-gray-500 mb-4">Chưa có sân nào. Hãy tạo sân đầu tiên!</p>
                                   <Button onClick={() => handleAddField()}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Thêm sân mới
                                   </Button>
                              </Card>
                         ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                   {fields.map((field) => {
                                        const primaryImage =
                                             Array.isArray(field.images) && field.images.length > 0
                                                  ? field.images[0]
                                                  : field.image;
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

                                                       {field.pricePerHour > 0 && (
                                                            <div className="flex items-center font-bold text-lg text-red-500">
                                                                 <DollarSign className="w-4 h-4 mr-1" />
                                                                 <span>{formatCurrency(field.pricePerHour)}/giờ</span>
                                                            </div>
                                                       )}

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
                         onImageUpload={handleFieldImageUpload}
                         onAddComplex={handleRequestCreateComplex}
                         onBankAccountChange={handleBankAccountChange}
                         onNavigateBankAccounts={handleNavigateBankAccounts}
                         isUploadingImage={fieldImageUploading}
                         imageInputRef={fieldImageInputRef}
                         onTriggerImagePicker={triggerFieldImagePicker}
                         onUploadAreaKeyDown={handleFieldUploadAreaKeyDown}
                         onRemoveImage={removeFieldImage}
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
          </OwnerLayout>
     );
};

export default FieldManagement;
