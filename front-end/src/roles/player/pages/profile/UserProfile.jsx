import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Calendar, Users, Edit3, Save, X, Camera, Heart, Target, Shield, Clock, Star, CheckCircle, AlertCircle } from "lucide-react";
import { Input, Button, Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Avatar, Textarea, LoadingSpinner, FadeIn, SlideIn, Section, Container } from "../../../../shared/components/ui";
import { profileService } from "../../../../shared/index";
import ErrorDisplay from "../../../../shared/components/ErrorDisplay";
import BankingManagement from "./BankingManagement";

export default function UserProfile({ user }) {
     const [isEditing, setIsEditing] = useState(false);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState('');
     const [info, setInfo] = useState('');
     const [profileData, setProfileData] = useState({
          // Basic user info from registration
          email: user?.email || "",
          fullName: user?.fullName || "",
          phone: user?.phone || "",
          avatar: user?.avatar || null,
          roleName: user?.roleName || "Player",
          emailVerified: user?.emailVerified || true, // Mặc định true vì đã qua OTP khi đăng ký

          // Additional fields from UserProfiles table
          dateOfBirth: user?.dateOfBirth || "",
          gender: user?.gender || "",
          address: user?.address || "",
          preferredPositions: user?.preferredPositions || "",
          skillLevel: user?.skillLevel || "",
          bio: user?.bio || "",

          // Account status
          status: user?.status || "Active",
          createdAt: user?.createdAt || new Date().toISOString()
     });

     const [formData, setFormData] = useState({ ...profileData });

     // Load profile data on component mount
     useEffect(() => {
          if (user?.userID) {
               setIsLoading(true);
               loadProfileData();
          }
          // Scroll to top on mount
          window.scrollTo({
               top: 0,
               behavior: 'smooth'
          });
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [user?.userID]);

     // Scroll to top when entering edit mode
     useEffect(() => {
          if (isEditing) {
               window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
               });
          }
     }, [isEditing]);

     const loadProfileData = async () => {
          if (!user?.userID) return;

          try {
               setIsLoading(true);
               const result = await profileService.getProfile(user.userID);
               if (result.ok && result.profile) {
                    const profile = result.profile;
                    // Map profile data with proper field names
                    const mappedProfile = {
                         dateOfBirth: profile.dateOfBirth || profile.DateOfBirth || "",
                         gender: profile.gender || profile.Gender || "",
                         address: profile.address || profile.Address || "",
                         preferredPositions: profile.preferredPositions || profile.PreferredPositions || "",
                         skillLevel: profile.skillLevel || profile.SkillLevel || "",
                         bio: profile.bio || profile.Bio || "",
                    };

                    setProfileData(prev => ({
                         ...prev,
                         ...mappedProfile
                    }));
                    setFormData(prev => ({
                         ...prev,
                         ...mappedProfile
                    }));
               }
          } catch (error) {
               console.error('Error loading profile:', error);
          } finally {
               setIsLoading(false);
          }
     };

     const skillLevels = [
          { value: "beginner", label: "Mới bắt đầu" },
          { value: "intermediate", label: "Trung bình" },
          { value: "advanced", label: "Nâng cao" },
          { value: "professional", label: "Chuyên nghiệp" }
     ];

     const positions = [
          "Thủ môn",
          "Hậu vệ",
          "Tiền vệ",
          "Tiền đạo",
          "Không quan trọng"
     ];

     const genders = ["Nam", "Nữ", "Khác"];

     const handleInputChange = (field, value) => {
          setFormData(prev => ({
               ...prev,
               [field]: value
          }));
     };

     const handleSave = async () => {
          if (!user?.userID) {
               setError('Không tìm thấy thông tin người dùng');
               return;
          }

          setIsLoading(true);
          setError('');
          setInfo('');

          try {
               // Only send updatable fields to API
               const updateData = {
                    dateOfBirth: formData.dateOfBirth || "",
                    gender: formData.gender || "",
                    address: formData.address || "",
                    preferredPositions: formData.preferredPositions || "",
                    skillLevel: formData.skillLevel || "",
                    bio: formData.bio || "",
               };

               const result = await profileService.updateProfile(user.userID, updateData);

               if (!result.ok) {
                    setError(result.reason || 'Cập nhật profile thất bại');
                    setIsLoading(false);
                    return;
               }

               // Update local state - only update the fields that were sent
               setProfileData(prev => ({
                    ...prev,
                    ...updateData
               }));
               setInfo(result.message || 'Cập nhật profile thành công');
               setIsEditing(false);

               // Update user in localStorage - only update the fields that were sent
               const updatedUser = { ...user, ...updateData };
               localStorage.setItem('user', JSON.stringify(updatedUser));

          } catch (error) {
               setError(error.message || 'Có lỗi xảy ra khi cập nhật profile');
               console.error('Profile update error:', error);
          } finally {
               setIsLoading(false);
          }
     };

     const handleCancel = () => {
          setFormData({ ...profileData });
          setIsEditing(false);
     };

     const handleAvatarUpload = (event) => {
          const file = event.target.files[0];
          if (file) {
               const reader = new FileReader();
               reader.onload = (e) => {
                    setFormData(prev => ({
                         ...prev,
                         avatar: e.target.result
                    }));
               };
               reader.readAsDataURL(file);
          }
     };

     const formatDate = (dateString) => {
          return new Date(dateString).toLocaleDateString('vi-VN');
     };

     return (
          <Section className="relative min-h-screen ">

               <div className="absolute inset-0 bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center border border-teal-600 rounded-3xl" />
               <Container>
                    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                         {/* Header */}
                         <SlideIn direction="down" delay={300}>
                              <div className="my-2 text-center">
                                   <div className="inline-flex items-center justify-center w-12 h-12 bg-white/90 border border-teal-300 rounded-3xl shadow-sm mb-1">
                                        <User className="w-8 h-8 text-teal-600" />
                                   </div>
                                   <h1 className="text-3xl font-bold text-teal-900 mb-1">Hồ sơ cá nhân</h1>
                                   <p className="text-teal-600 text-base max-w-2xl mx-auto">
                                        Quản lý thông tin cá nhân và tài khoản của bạn với giao diện trực quan, dễ thao tác
                                   </p>
                              </div>
                         </SlideIn>

                         {/* Error and Info Messages */}
                         {error && (
                              <ErrorDisplay
                                   type="error"
                                   title="Lỗi cập nhật"
                                   message={error}
                                   onClose={() => setError('')}
                              />
                         )}
                         {info && (
                              <ErrorDisplay
                                   type="success"
                                   title="Thành công"
                                   message={info}
                                   onClose={() => setInfo('')}
                              />
                         )}
                         <div className="flex gap-5 px-5 my-2">
                              {/* Profile Overview Card */}
                              <FadeIn delay={200}>
                                   <Card className="sticky top-28 border border-teal-200/80 bg-white/90 shadow-xl backdrop-blur rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                                        <CardHeader className="text-center pb-3 border-b border-teal-300/70 bg-gradient-to-br from-teal-50 via-white to-white rounded-t-3xl">
                                             <div className="relative inline-block">
                                                  <Avatar className="w-28 h-28 mx-auto mb-4 ring-4 ring-teal-300">
                                                       {formData.avatar ? (
                                                            <img
                                                                 src={formData.avatar}
                                                                 alt="Avatar"
                                                                 className="w-full h-full object-cover rounded-2xl"
                                                            />
                                                       ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-teal-600 to-teal-600 rounded-2xl flex items-center justify-center">
                                                                 <User className="w-20 h-20 text-white" />
                                                            </div>
                                                       )}
                                                  </Avatar>
                                                  {isEditing && (
                                                       <label className="absolute -bottom-2 -right-2 bg-teal-600 text-white p-3 rounded-2xl cursor-pointer hover:bg-teal-600 transition-all duration-300 shadow-lg hover:scale-105">
                                                            <Camera className="w-5 h-5" />
                                                            <input
                                                                 type="file"
                                                                 accept="image/*"
                                                                 onChange={handleAvatarUpload}
                                                                 className="hidden"
                                                            />
                                                       </label>
                                                  )}
                                             </div>
                                             <CardTitle className="text-2xl font-bold text-teal-900 mb-2">{formData.fullName}</CardTitle>
                                             <div className="flex items-center justify-center text-teal-600 mb-4">
                                                  <Mail className="w-4 h-4 mr-1" />
                                                  <span className="text-sm">{formData.email}</span>
                                             </div>
                                             <div className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium ${formData.status === 'Active'
                                                  ? 'bg-green-100 text-green-600 border border-green-200'
                                                  : 'bg-red-300 text-red-700 border border-red-200'
                                                  }`}>
                                                  <Shield className="w-4 h-4 mr-2" />
                                                  {formData.roleName === 'Admin' ? 'Quản trị viên' :
                                                       formData.roleName === 'Owner' ? 'Chủ sân' : 'Người chơi'}
                                             </div>
                                        </CardHeader>
                                        <CardContent className="pt-3">
                                             <div className="rounded-2xl border border-gray-200 bg-gray-50/90 px-2 py-2">
                                                  <div className="flex items-start gap-3">
                                                       <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                                                            <Heart className="w-5 h-5" />
                                                       </div>
                                                       <div className="flex-1">
                                                            <p className="text-sm font-semibold tracking-wide text-gray-700 mb-2">Giới thiệu</p>
                                                            {isEditing ? (
                                                                 <Textarea
                                                                      value={formData.bio}
                                                                      onChange={(e) => handleInputChange('bio', e.target.value)}
                                                                      placeholder="Viết một chút về bản thân..."
                                                                      rows={3}
                                                                      className="rounded-xl border-gray-200 focus:border-gray-600 focus:ring-gray-600 text-sm"
                                                                 />
                                                            ) : (
                                                                 <p className="text-xs font-medium text-gray-900 leading-relaxed">
                                                                      {formData.bio || "Chưa có giới thiệu"}
                                                                 </p>
                                                            )}
                                                       </div>
                                                  </div>
                                             </div>
                                        </CardContent>
                                   </Card>

                              </FadeIn>

                              {/* Profile Details */}
                              <FadeIn delay={300}>
                                   <div className=" space-y-6">
                                        {/* Basic Information */}
                                        <SlideIn direction="right" delay={300}>
                                             <Card className="border border-teal-200/80 bg-white/95 shadow-xl backdrop-blur rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                                                  <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-teal-300/70 bg-gradient-to-r from-teal-50 via-white to-white rounded-t-3xl">
                                                       <CardTitle className="flex items-center text-teal-900">
                                                            <div className="p-2 bg-teal-200 rounded-xl mr-3">
                                                                 <User className="w-5 h-5 text-teal-700" />
                                                            </div>
                                                            Thông tin cơ bản
                                                       </CardTitle>
                                                       {!isEditing ? (
                                                            <Button
                                                                 variant="outline"
                                                                 size="sm"
                                                                 onClick={() => setIsEditing(true)}
                                                                 className="border-teal-300 text-teal-700 hover:bg-teal-50 rounded-xl shadow-sm"
                                                            >
                                                                 <Edit3 className="w-4 h-4 mr-2" />
                                                                 Chỉnh sửa
                                                            </Button>
                                                       ) : (
                                                            <div className="flex gap-2">
                                                                 <Button
                                                                      variant="outline"
                                                                      size="sm"
                                                                      onClick={handleCancel}
                                                                      className="border-red-300 text-red-700 hover:bg-red-50 rounded-xl shadow-sm"
                                                                 >
                                                                      <X className="w-4 h-4 mr-2" />
                                                                      Hủy
                                                                 </Button>
                                                                 <Button
                                                                      size="sm"
                                                                      onClick={handleSave}
                                                                      disabled={isLoading}
                                                                      className="bg-teal-600 hover:bg-teal-600 rounded-xl shadow-sm"
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
                                                       )}
                                                  </CardHeader>
                                                  <CardContent className="space-y-3 p-6">
                                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div className="rounded-2xl border border-teal-300 bg-white/80 p-2 shadow-sm">
                                                                 <div className="flex items-start gap-2">
                                                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                                                           <User className="w-5 h-5" />
                                                                      </div>
                                                                      <div className="flex-1 space-y-1">
                                                                           <p className="text-sm font-semibold tracking-wide text-teal-600">
                                                                                Họ và tên
                                                                           </p>
                                                                           <p className="text-lg font-semibold text-teal-900 leading-tight">
                                                                                {formData.fullName || "Chưa cập nhật"}
                                                                           </p>
                                                                      </div>
                                                                 </div>
                                                            </div>

                                                            <div className="rounded-2xl border border-teal-300 bg-white/80 p-2 shadow-sm">
                                                                 <div className="flex items-start gap-3">
                                                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                                                           <Mail className="w-5 h-5" />
                                                                      </div>
                                                                      <div className="flex-1 space-y-2">
                                                                           <p className="text-sm font-semibold tracking-wide text-teal-600">
                                                                                Email đăng nhập
                                                                           </p>
                                                                           <div className="space-y-2">
                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                     <p className="text-base font-semibold text-teal-900">
                                                                                          {formData.email}
                                                                                     </p>
                                                                                     <span className={`inline-flex items-center gap-1 rounded-2xl px-2 py-1 text-sm font-semibold ${formData.emailVerified
                                                                                          ? 'bg-green-300 text-green-700 border border-green-200'
                                                                                          : 'bg-yellow-300 text-yellow-700 border border-yellow-200'
                                                                                          }`}>
                                                                                          {formData.emailVerified ? (
                                                                                               <>
                                                                                                    <CheckCircle className="w-3 h-3" />
                                                                                                    Đã xác thực
                                                                                               </>
                                                                                          ) : (
                                                                                               <>
                                                                                                    <AlertCircle className="w-3 h-3" />
                                                                                                    Chưa xác thực
                                                                                               </>
                                                                                          )}
                                                                                     </span>
                                                                                </div>
                                                                                {!formData.emailVerified && (
                                                                                     <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                                                                                          Email chưa được xác thực qua OTP. Vui lòng kiểm tra email để xác thực.
                                                                                     </div>
                                                                                )}
                                                                           </div>
                                                                      </div>
                                                                 </div>
                                                            </div>

                                                            <div className="rounded-2xl border border-teal-300 bg-white/80 p-2 shadow-sm">
                                                                 <div className="flex items-start gap-3">
                                                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                                                           <Phone className="w-5 h-5" />
                                                                      </div>
                                                                      <div className="flex-1 space-y-2">
                                                                           <p className="text-sm font-semibold tracking-wide text-teal-600">
                                                                                Số điện thoại
                                                                           </p>
                                                                           <p className="text-base font-semibold text-teal-900">
                                                                                {formData.phone || "Chưa cập nhật"}
                                                                           </p>
                                                                      </div>
                                                                 </div>
                                                            </div>

                                                            <div className="rounded-2xl border border-teal-300 bg-white/80 p-2 shadow-sm">
                                                                 <div className="flex items-start gap-3">
                                                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                                                           <Calendar className="w-5 h-5" />
                                                                      </div>
                                                                      <div className="flex-1 space-y-2">
                                                                           <p className="text-sm font-semibold tracking-wide text-teal-600">
                                                                                Ngày sinh
                                                                           </p>
                                                                           {isEditing ? (
                                                                                <Input
                                                                                     type="date"
                                                                                     value={formData.dateOfBirth}
                                                                                     onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                                                                     className="rounded-xl border-teal-200 focus:border-teal-600 focus:ring-teal-600"
                                                                                />
                                                                           ) : (
                                                                                <p className="text-base font-semibold text-teal-900">
                                                                                     {formData.dateOfBirth ? formatDate(formData.dateOfBirth) : "Chưa cập nhật"}
                                                                                </p>
                                                                           )}
                                                                      </div>
                                                                 </div>
                                                            </div>

                                                            <div className="rounded-2xl border border-teal-300 bg-white/80 p-2 shadow-sm">
                                                                 <div className="flex items-start gap-3">
                                                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                                                           <Heart className="w-5 h-5" />
                                                                      </div>
                                                                      <div className="flex-1 space-y-2">
                                                                           <p className="text-sm font-semibold tracking-wide text-teal-600">
                                                                                Giới tính
                                                                           </p>
                                                                           {isEditing ? (
                                                                                <Select
                                                                                     value={formData.gender}
                                                                                     onValueChange={(value) => handleInputChange('gender', value)}
                                                                                >
                                                                                     <SelectTrigger className="rounded-xl border-teal-200 focus:border-teal-600 focus:ring-teal-600">
                                                                                          <SelectValue placeholder="Chọn giới tính" />
                                                                                     </SelectTrigger>
                                                                                     <SelectContent>
                                                                                          {genders.map((gender) => (
                                                                                               <SelectItem key={gender} value={gender}>
                                                                                                    {gender}
                                                                                               </SelectItem>
                                                                                          ))}
                                                                                     </SelectContent>
                                                                                </Select>
                                                                           ) : (
                                                                                <p className="text-base font-semibold text-teal-900">
                                                                                     {formData.gender || "Chưa cập nhật"}
                                                                                </p>
                                                                           )}
                                                                      </div>
                                                                 </div>
                                                            </div>

                                                            <div className="rounded-2xl border border-teal-300 bg-white/80 p-2 shadow-sm">
                                                                 <div className="flex items-start gap-3">
                                                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                                                           <Star className="w-5 h-5" />
                                                                      </div>
                                                                      <div className="flex-1 space-y-2">
                                                                           <p className="text-sm font-semibold tracking-wide text-teal-600">
                                                                                Trình độ
                                                                           </p>
                                                                           {isEditing ? (
                                                                                <Select
                                                                                     value={formData.skillLevel}
                                                                                     onValueChange={(value) => handleInputChange('skillLevel', value)}
                                                                                >
                                                                                     <SelectTrigger className="rounded-xl border-teal-200 focus:border-teal-600 focus:ring-teal-600">
                                                                                          <SelectValue placeholder="Chọn trình độ" />
                                                                                     </SelectTrigger>
                                                                                     <SelectContent>
                                                                                          {skillLevels.map((level) => (
                                                                                               <SelectItem key={level.value} value={level.value}>
                                                                                                    {level.label}
                                                                                               </SelectItem>
                                                                                          ))}
                                                                                     </SelectContent>
                                                                                </Select>
                                                                           ) : (
                                                                                <p className="text-base font-semibold text-teal-900">
                                                                                     {formData.skillLevel ? skillLevels.find(s => s.value === formData.skillLevel)?.label : "Chưa cập nhật"}
                                                                                </p>
                                                                           )}
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       </div>

                                                       <div className="rounded-2xl border border-teal-300 bg-white/80 p-2 shadow-sm">
                                                            <div className="flex items-start gap-3">
                                                                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                                                      <MapPin className="w-5 h-5" />
                                                                 </div>
                                                                 <div className="flex-1 space-y-2">
                                                                      <p className="text-sm font-semibold tracking-wide text-teal-600">
                                                                           Địa chỉ
                                                                      </p>
                                                                      {isEditing ? (
                                                                           <Textarea
                                                                                value={formData.address}
                                                                                onChange={(e) => handleInputChange('address', e.target.value)}
                                                                                placeholder="Nhập địa chỉ"
                                                                                rows={3}
                                                                                className="rounded-xl border-teal-200 focus:border-teal-600 focus:ring-teal-600"
                                                                           />
                                                                      ) : (
                                                                           <p className="text-base font-semibold text-teal-900 leading-relaxed">
                                                                                {formData.address || "Chưa cập nhật"}
                                                                           </p>
                                                                      )}
                                                                 </div>
                                                            </div>
                                                       </div>
                                                  </CardContent>
                                             </Card>
                                        </SlideIn>

                                        {/* Football Preferences */}
                                        <SlideIn direction="right" delay={200}>
                                             <Card className="border border-teal-200/80 bg-white/95 shadow-xl backdrop-blur rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                                                  <CardHeader className="border-b border-teal-300/70 bg-gradient-to-r from-teal-50 via-white to-white py-4 px-6 rounded-t-3xl">
                                                       <CardTitle className="flex items-center text-teal-900">
                                                            <div className="p-2 bg-teal-200 rounded-xl mr-3">
                                                                 <Target className="w-5 h-5 text-teal-700" />
                                                            </div>
                                                            Sở thích bóng đá
                                                       </CardTitle>
                                                  </CardHeader>
                                                  <CardContent className="space-y-5 p-6">
                                                       <div className="rounded-2xl border border-teal-300 bg-white/80 p-2 shadow-sm">
                                                            <div className="flex items-start gap-3">
                                                                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                                                      <Users className="w-5 h-5" />
                                                                 </div>
                                                                 <div className="flex-1 space-y-2">
                                                                      <p className="text-sm font-semibold tracking-wide text-teal-600">
                                                                           Vị trí ưa thích
                                                                      </p>
                                                                      {isEditing ? (
                                                                           <Select
                                                                                value={formData.preferredPositions}
                                                                                onValueChange={(value) => handleInputChange('preferredPositions', value)}
                                                                           >
                                                                                <SelectTrigger className="rounded-xl border-teal-200 focus:border-teal-600 focus:ring-teal-600">
                                                                                     <SelectValue placeholder="Chọn vị trí" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                     {positions.map((position) => (
                                                                                          <SelectItem key={position} value={position}>
                                                                                               {position}
                                                                                          </SelectItem>
                                                                                     ))}
                                                                                </SelectContent>
                                                                           </Select>
                                                                      ) : (
                                                                           <p className="text-base font-semibold text-teal-900">
                                                                                {formData.preferredPositions || "Chưa cập nhật"}
                                                                           </p>
                                                                      )}
                                                                 </div>
                                                            </div>
                                                       </div>
                                                       <div className="rounded-2xl border border-teal-300 bg-white/80 p-2 shadow-sm">
                                                            <div className="flex items-start gap-3">
                                                                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                                                      <Heart className="w-5 h-5" />
                                                                 </div>
                                                                 <div className="flex-1 space-y-2">
                                                                      <p className="text-sm font-semibold tracking-wide text-teal-600">
                                                                           Giới thiệu bản thân
                                                                      </p>
                                                                      {isEditing ? (
                                                                           <Textarea
                                                                                value={formData.bio}
                                                                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                                                                placeholder="Viết một chút về bản thân..."
                                                                                rows={4}
                                                                                className="rounded-xl border-teal-200 focus:border-teal-600 focus:ring-teal-600"
                                                                           />
                                                                      ) : (
                                                                           <p className="text-base font-semibold text-teal-900 leading-relaxed">
                                                                                {formData.bio || "Chưa cập nhật"}
                                                                           </p>
                                                                      )}
                                                                 </div>
                                                            </div>
                                                       </div>
                                                  </CardContent>
                                             </Card>
                                        </SlideIn>

                                        {/* Banking Management */}
                                        <BankingManagement user={user} />

                                        {/* Account Information */}
                                        <SlideIn direction="right" delay={600}>
                                             <Card className="border border-teal-200/80 bg-white/95 shadow-xl backdrop-blur rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                                                  <CardHeader className="border-b border-teal-300/70 bg-gradient-to-r from-teal-50 via-white to-white py-4 px-6 rounded-t-3xl">
                                                       <CardTitle className="flex items-center text-teal-900">
                                                            <div className="p-2 bg-teal-200 rounded-xl mr-3">
                                                                 <Shield className="w-5 h-5 text-teal-700" />
                                                            </div>
                                                            Thông tin tài khoản
                                                       </CardTitle>
                                                  </CardHeader>
                                                  <CardContent className="space-y-5 p-6">
                                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                            <div className="rounded-2xl border border-teal-300 bg-white/80 p-2 shadow-sm">
                                                                 <div className="flex items-start gap-3">
                                                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                                                           <Shield className="w-5 h-5" />
                                                                      </div>
                                                                      <div className="flex-1 space-y-2">
                                                                           <p className="text-sm font-semibold tracking-wide text-teal-600">
                                                                                Trạng thái tài khoản
                                                                           </p>
                                                                           <span className={`inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-sm font-semibold ${formData.status === 'Active'
                                                                                ? 'bg-green-50 text-green-700 border border-green-200'
                                                                                : 'bg-red-300 text-red-700 border border-red-200'
                                                                                }`}>
                                                                                <Shield className="w-4 h-4" />
                                                                                {formData.status === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
                                                                           </span>
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                            <div className="rounded-2xl border border-teal-300 bg-white/80 p-2 shadow-sm">
                                                                 <div className="flex items-start gap-3">
                                                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                                                           <Clock className="w-5 h-5" />
                                                                      </div>
                                                                      <div className="flex-1 space-y-2">
                                                                           <p className="text-sm font-semibold tracking-wide text-teal-600">
                                                                                Ngày tạo tài khoản
                                                                           </p>
                                                                           <p className="text-base font-semibold text-teal-900">
                                                                                {formatDate(formData.createdAt)}
                                                                           </p>
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       </div>
                                                  </CardContent>
                                             </Card>
                                        </SlideIn>
                                   </div>
                              </FadeIn>
                         </div>

                    </div>
               </Container>
          </Section>
     );
}
