import { useState, useEffect } from "react";
import { User, Mail, Phone, Edit3, Save, X, Camera, Lock } from "lucide-react";
import { Input, Button, Card, CardContent, CardHeader, CardTitle, Avatar, AvatarImage, AvatarFallback, LoadingSpinner } from "../../../shared/components/ui";
import { profileService } from "../../../shared/index";
import { validateVietnamPhone } from "../../../shared/services/authService";
import ChangePasswordModal from "../../../shared/components/ChangePasswordModal";
import Swal from "sweetalert2";
import { useAuth } from "../../../contexts/AuthContext";

export default function ProfileSettings({ isDemo = false }) {
     const { user, updateUser } = useAuth();
     const [isEditing, setIsEditing] = useState(false);
     const [isLoading, setIsLoading] = useState(false);
     const [avatarFile, setAvatarFile] = useState(null);
     const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
     const [profileData, setProfileData] = useState({
          email: user?.email || "",
          fullName: user?.fullName || user?.name || "",
          phone: user?.phone || "",
          avatar: user?.avatar || null,
     });

     const [formData, setFormData] = useState({ ...profileData });

     useEffect(() => {
          const token = localStorage.getItem("token");
          if (token && !isDemo) {
               setIsLoading(true);
               loadProfileData();
          }
          window.scrollTo({
               top: 0,
               behavior: 'smooth'
          });
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, []);

     useEffect(() => {
          if (isEditing) {
               window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
               });
          }
     }, [isEditing]);

     const loadProfileData = async () => {
          const token = localStorage.getItem("token");
          if (!token) {
               console.warn('No token found, cannot load profile');
               return;
          }

          try {
               setIsLoading(true);
               const result = await profileService.getProfile();
               if (result.ok && result.profile) {
                    const profile = result.profile;
                    const mappedProfile = {
                         fullName: profile.fullName || profile.FullName || user?.fullName || "",
                         phone: profile.phone || profile.Phone || user?.phone || "",
                         email: profile.email || profile.Email || user?.email || "",
                         avatar: profile.avatar || profile.Avatar || user?.avatar || null,
                    };

                    setProfileData(prev => ({
                         ...prev,
                         ...mappedProfile
                    }));
                    setFormData(prev => ({
                         ...prev,
                         ...mappedProfile
                    }));
                    // Update user context with profile data including avatar
                    if (updateUser) {
                         const updatedUser = { ...user, ...mappedProfile };
                         updateUser(updatedUser);
                    }
               } else if (result.reason) {
                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: result.reason,
                         confirmButtonText: 'Đóng'
                    });
               }
          } catch (error) {
               console.error('Error loading profile:', error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể tải thông tin profile',
                    confirmButtonText: 'Đóng'
               });
          } finally {
               setIsLoading(false);
          }
     };

     // Character limits
     const MAX_FULLNAME_LENGTH = 100;
     const WARNING_THRESHOLD = 90;

     // Helper function to get character count warning class
     const getCharCountClass = (length) => {
          if (length >= MAX_FULLNAME_LENGTH) return "text-red-500 font-medium";
          if (length >= WARNING_THRESHOLD) return "text-yellow-600";
          return "text-gray-400";
     };

     /**
      * Xử lý thay đổi input trong form profile
      * @param {string} field - Tên field cần cập nhật
      * @param {any} value - Giá trị mới
      */
     const handleInputChange = (field, value) => {
          setFormData(prev => ({
               ...prev,
               [field]: value
          }));
     };

     /**
      * Xử lý lưu thông tin profile
      * - Validate token
      * - Validate số điện thoại
      * - Upload avatar mới (nếu có)
      * - Gọi API cập nhật profile
      */
     const handleSave = async () => {
          const token = localStorage.getItem("token");
          if (!token) {
               Swal.fire({
                    icon: 'warning',
                    title: 'Phiên đăng nhập đã hết hạn',
                    text: 'Vui lòng đăng nhập lại',
                    confirmButtonText: 'Đóng'
               });
               return;
          }

          // Validate số điện thoại Việt Nam
          if (formData.phone) {
               const phoneValidation = validateVietnamPhone(formData.phone);
               if (!phoneValidation.isValid) {
                    Swal.fire({
                         icon: 'warning',
                         title: 'Số điện thoại không hợp lệ',
                         text: phoneValidation.message,
                         confirmButtonText: 'Đóng'
                    });
                    return;
               }
          }

          setIsLoading(true);

          try {
               const updateData = {
                    fullName: formData.fullName || "",
                    phone: formData.phone || "",
               };

               // Gọi API update cho owner/admin
               const result = await profileService.updateOwnerAdminProfile(updateData, avatarFile);

               if (!result.ok) {
                    Swal.fire({
                         icon: 'error',
                         title: 'Cập nhật thất bại',
                         text: result.reason || 'Cập nhật profile thất bại',
                         confirmButtonText: 'Đóng'
                    });
                    setIsLoading(false);
                    return;
               }

               // Update avatar URL nếu có trong response
               let updatedFormData = { ...formData };
               if (result.data?.avatarUrl) {
                    updatedFormData.avatar = result.data.avatarUrl;
               } else if (result.data?.avatar) {
                    updatedFormData.avatar = result.data.avatar;
               } else if (result.data?.data?.avatarUrl) {
                    updatedFormData.avatar = result.data.data.avatarUrl;
               } else if (result.data?.data?.avatar) {
                    updatedFormData.avatar = result.data.data.avatar;
               }

               // Update local state
               setProfileData(updatedFormData);
               setFormData(updatedFormData);
               setAvatarFile(null);
               setIsEditing(false);

               // Update user in context and localStorage
               const updatedUser = { ...user, ...updatedFormData };
               if (updateUser) {
                    updateUser(updatedUser);
               } else {
                    localStorage.setItem('user', JSON.stringify(updatedUser));
               }

               Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: result.message || 'Cập nhật profile thành công',
                    confirmButtonText: 'Đóng',
                    timer: 2000,
                    timerProgressBar: true
               });

          } catch (error) {
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Có lỗi xảy ra khi cập nhật profile',
                    confirmButtonText: 'Đóng'
               });
               console.error('Profile update error:', error);
          } finally {
               setIsLoading(false);
          }
     };

     /**
      * Hủy bỏ thay đổi và reset form về dữ liệu gốc
      */
     const handleCancel = () => {
          setFormData({ ...profileData });
          setAvatarFile(null);
          setIsEditing(false);
     };

     /**
      * Xử lý upload avatar mới
      * - Validate file type (chỉ chấp nhận ảnh)
      * - Validate file size (tối đa 10MB)
      * - Tạo preview URL
      * @param {Event} event - Event từ input file
      */
     const handleAvatarUpload = (event) => {
          const file = event.target.files[0];
          if (!file) return;

          if (!file.type.startsWith('image/')) {
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'File phải là hình ảnh',
                    confirmButtonText: 'Đóng'
               });
               return;
          }

          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Kích thước file không được vượt quá 10MB',
                    confirmButtonText: 'Đóng'
               });
               return;
          }

          setAvatarFile(file);

          const reader = new FileReader();
          reader.onload = (e) => {
               setFormData(prev => ({
                    ...prev,
                    avatar: e.target.result
               }));
          };
          reader.readAsDataURL(file);

          Swal.fire({
               icon: 'info',
               title: 'Ảnh đã được chọn',
               text: 'Nhấn "Lưu" để cập nhật profile',
               confirmButtonText: 'Đóng',
               timer: 2000,
               timerProgressBar: true
          });
     };

     if (isLoading && !profileData.fullName) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <LoadingSpinner />
               </div>
          );
     }

     return (
          <div className="container mx-auto px-4 py-8 max-w-4xl">
               <Card className="shadow-lg rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-t-2xl">
                         <div className="flex items-center justify-between">
                              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                   <User className="w-6 h-6" />
                                   Cài đặt hồ sơ
                              </CardTitle>
                              {!isEditing ? (
                                   <Button
                                        onClick={() => setIsEditing(true)}
                                        variant="outline"
                                        className="bg-white rounded-2xl hover:text-teal-600 text-teal-600 hover:bg-teal-50"
                                   >
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Chỉnh sửa
                                   </Button>
                              ) : (
                                   <div className="flex gap-2">
                                        <Button
                                             onClick={handleCancel}
                                             variant="outline"
                                             className="bg-white text-gray-600 hover:bg-gray-50"
                                        >
                                             <X className="w-4 h-4 mr-2" />
                                             Hủy
                                        </Button>
                                        <Button
                                             onClick={handleSave}
                                             disabled={isLoading}
                                             className="bg-white text-teal-600 hover:bg-teal-50"
                                        >
                                             {isLoading ? (
                                                  <LoadingSpinner className="w-4 h-4 mr-2" />
                                             ) : (
                                                  <Save className="w-4 h-4 mr-2" />
                                             )}
                                             Lưu
                                        </Button>
                                   </div>
                              )}
                         </div>
                    </CardHeader>

                    <CardContent className="p-6">
                         {/* Avatar Section */}
                         <div className="flex flex-col items-center mb-8">
                              <div className="relative">
                                   <Avatar className="w-32 h-32 border-4 border-teal-200">
                                        <AvatarImage
                                             src={formData.avatar || profileData.avatar}
                                             alt="Avatar"
                                             className="object-cover"
                                        />
                                        <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl font-bold">
                                             {formData.fullName?.charAt(0) || profileData.fullName?.charAt(0) || user?.fullName?.charAt(0) || user?.name?.charAt(0) || 'O'}
                                        </AvatarFallback>
                                   </Avatar>
                                   {isEditing && (
                                        <label className="absolute bottom-0 right-0 bg-teal-600 text-white rounded-full p-2 cursor-pointer hover:bg-teal-700 transition shadow-lg">
                                             <Camera className="w-5 h-5" />
                                             <input
                                                  type="file"
                                                  accept="image/*"
                                                  className="hidden"
                                                  onChange={handleAvatarUpload}
                                             />
                                        </label>
                                   )}
                              </div>
                              <p className="text-sm text-gray-500 mt-2">
                                   {isEditing ? "Nhấn vào icon camera để thay đổi ảnh đại diện" : ""}
                              </p>
                         </div>

                         {/* Profile Fields */}
                         <div className="space-y-6">
                              {/* Full Name */}
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <User className="w-4 h-4 inline mr-2" />
                                        Họ và tên
                                   </label>
                                   {isEditing ? (
                                        <>
                                             <Input
                                                  value={formData.fullName}
                                                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                                                  placeholder="Nhập họ và tên"
                                                  maxLength={MAX_FULLNAME_LENGTH}
                                                  className="w-full"
                                             />
                                             <div className="flex justify-end mt-1">
                                                  <span className={`text-xs ${getCharCountClass(formData.fullName.length)}`}>
                                                       {formData.fullName.length}/{MAX_FULLNAME_LENGTH}
                                                       {formData.fullName.length >= MAX_FULLNAME_LENGTH && " (đã đạt giới hạn)"}
                                                  </span>
                                             </div>
                                        </>
                                   ) : (
                                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                             {profileData.fullName || "Chưa cập nhật"}
                                        </p>
                                   )}
                              </div>

                              {/* Email (Read-only) */}
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail className="w-4 h-4 inline mr-2" />
                                        Email
                                   </label>
                                   <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                        {profileData.email || "Chưa cập nhật"}
                                   </p>
                                   <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                              </div>

                              {/* Phone */}
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Phone className="w-4 h-4 inline mr-2" />
                                        Số điện thoại
                                   </label>
                                   {isEditing ? (
                                        <Input
                                             value={formData.phone}
                                             onChange={(e) => handleInputChange('phone', e.target.value)}
                                             placeholder="Nhập số điện thoại"
                                             className="w-full"
                                        />
                                   ) : (
                                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                             {profileData.phone || "Chưa cập nhật"}
                                        </p>
                                   )}
                              </div>

                              {/* Change Password Button */}
                              <div className="pt-4 border-t">
                                   <Button
                                        onClick={() => setIsChangePasswordOpen(true)}
                                        variant="outline"
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 border-teal-600 text-teal-600 hover:bg-teal-50"
                                   >
                                        <Lock className="w-4 h-4" />
                                        Đổi mật khẩu
                                   </Button>
                              </div>
                         </div>
                    </CardContent>
               </Card>

               {/* Change Password Modal */}
               <ChangePasswordModal
                    isOpen={isChangePasswordOpen}
                    onClose={() => setIsChangePasswordOpen(false)}
                    accentColor="teal"
               />
          </div>
     );
}

