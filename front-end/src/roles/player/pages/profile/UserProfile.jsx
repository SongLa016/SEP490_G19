import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Calendar, Users, Edit3, Save, X, Camera, Heart, Target, Shield, Clock, Star, CheckCircle, AlertCircle } from "lucide-react";
import { Input, Button, Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Avatar, Container, Textarea, LoadingSpinner, FadeIn, SlideIn } from "../../../../shared/components/ui";
import { profileService } from "../../../../shared/index";
import ErrorDisplay from "../../../../shared/components/ErrorDisplay";

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
                    setProfileData(prev => ({
                         ...prev,
                         ...result.profile
                    }));
                    setFormData(prev => ({
                         ...prev,
                         ...result.profile
                    }));
               }
          } catch (error) {
               console.error('Error loading profile:', error);
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
               const result = await profileService.updateProfile(user.userID, formData);

               if (!result.ok) {
                    setError(result.reason || 'Cập nhật profile thất bại');
                    setIsLoading(false);
                    return;
               }

               // Update local state
               setProfileData({ ...formData });
               setInfo(result.message || 'Cập nhật profile thành công');
               setIsEditing(false);

               // Update user in localStorage
               const updatedUser = { ...user, ...formData };
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
          <div className="min-h-screen bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center">
               <Container>
                    {/* Header */}
                    <SlideIn direction="down" delay={100}>
                         <div className="my-2 text-center">
                              <div className="inline-flex items-center justify-center w-12 h-10 bg-teal-100 rounded-2xl mb-2">
                                   <User className="w-8 h-8 text-teal-600" />
                              </div>
                              <h1 className="text-4xl font-bold text-teal-900 mb-2">Hồ sơ cá nhân</h1>
                              <p className="text-teal-600 text-lg">Quản lý thông tin cá nhân và tài khoản của bạn</p>
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
                         {/* Profile Overview Card */}
                         <FadeIn delay={200}>
                              <div className="lg:col-span-1 ">
                                   <Card className="sticky top-8 shadow-xl bg-white/80 border-2 border-teal-300 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-2xl">
                                        <CardHeader className="text-center pb-6">
                                             <div className="relative inline-block">
                                                  <Avatar className="w-36 h-36 mx-auto mb-6 ring-4 ring-teal-100">
                                                       {formData.avatar ? (
                                                            <img
                                                                 src={formData.avatar}
                                                                 alt="Avatar"
                                                                 className="w-full h-full object-cover rounded-2xl"
                                                            />
                                                       ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center">
                                                                 <User className="w-20 h-20 text-white" />
                                                            </div>
                                                       )}
                                                  </Avatar>
                                                  {isEditing && (
                                                       <label className="absolute -bottom-2 -right-2 bg-teal-500 text-white p-3 rounded-2xl cursor-pointer hover:bg-teal-600 transition-all duration-300 shadow-lg hover:scale-105">
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
                                                  <Mail className="w-4 h-4 mr-2" />
                                                  <span className="text-sm">{formData.email}</span>
                                             </div>
                                             <div className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium ${formData.status === 'Active'
                                                  ? 'bg-green-100 text-green-700 border border-green-200'
                                                  : 'bg-red-100 text-red-700 border border-red-200'
                                                  }`}>
                                                  <Shield className="w-4 h-4 mr-2" />
                                                  {formData.roleName === 'Admin' ? 'Quản trị viên' :
                                                       formData.roleName === 'Owner' ? 'Chủ sân' : 'Người chơi'}
                                             </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                             <div className="space-y-4">
                                                  <div className="flex items-center p-3 bg-blue-100 border border-blue-200 rounded-2xl">
                                                       <div className="p-2 bg-blue-500 rounded-xl mr-3">
                                                            <Calendar className="w-5 h-5 text-white" />
                                                       </div>
                                                       <div>
                                                            <p className="text-sm font-medium text-blue-900">Tham gia</p>
                                                            <p className="text-xs text-blue-600">{formatDate(formData.createdAt)}</p>
                                                       </div>
                                                  </div>
                                                  <div className="flex items-center p-3 bg-green-100 border border-green-200 rounded-2xl">
                                                       <div className="p-2 bg-green-500 rounded-xl mr-3">
                                                            <Phone className="w-5 h-5 text-white" />
                                                       </div>
                                                       <div>
                                                            <p className="text-sm font-medium text-green-900">Số điện thoại</p>
                                                            <p className="text-xs text-green-600">{formData.phone}</p>
                                                       </div>
                                                  </div>
                                             </div>
                                        </CardContent>
                                   </Card>
                              </div>
                         </FadeIn>

                         {/* Profile Details */}
                         <FadeIn delay={300}>
                              <div className="lg:col-span-2 space-y-6">
                                   {/* Basic Information */}
                                   <SlideIn direction="right" delay={100}>
                                        <Card className="border-2 shadow-lg bg-white/90  border-teal-300 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-xl">
                                             <CardHeader className="flex flex-row items-center justify-between py-3 px-5 bg-gradient-to-r from-teal-50 to-teal-100 rounded-t-2xl">
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
                                                            className="border-teal-300 text-teal-700 hover:bg-teal-50 rounded-xl"
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
                                                                 className="border-red-300 text-red-700 hover:bg-red-50 rounded-xl"
                                                            >
                                                                 <X className="w-4 h-4 mr-2" />
                                                                 Hủy
                                                            </Button>
                                                            <Button
                                                                 size="sm"
                                                                 onClick={handleSave}
                                                                 disabled={isLoading}
                                                                 className="bg-teal-500 hover:bg-teal-600 rounded-xl"
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
                                             <CardContent className="space-y-6 p-6">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                       <div className="space-y-2">
                                                            <label className="flex items-center text-sm font-semibold text-teal-800 mb-2">
                                                                 <User className="w-4 h-4 mr-2 text-teal-600" />
                                                                 Họ và tên
                                                            </label>
                                                            {isEditing ? (
                                                                 <Input
                                                                      value={formData.fullName}
                                                                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                                                                      placeholder="Nhập họ và tên"
                                                                      className="rounded-xl border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                                                                 />
                                                            ) : (
                                                                 <div className="p-3 bg-teal-50 rounded-xl">
                                                                      <p className="text-teal-900 font-medium">{formData.fullName || "Chưa cập nhật"}</p>
                                                                 </div>
                                                            )}
                                                       </div>
                                                       <div className="space-y-2">
                                                            <label className="flex items-center text-sm font-semibold text-teal-800 mb-2">
                                                                 <Mail className="w-4 h-4 mr-2 text-teal-600" />
                                                                 Email
                                                            </label>
                                                            <div className="p-3 bg-teal-50 rounded-xl">
                                                                 <div className="flex items-center justify-between">
                                                                      <div className="flex items-center">
                                                                           <Mail className="w-4 h-4 mr-2 text-teal-600" />
                                                                           <p className="text-teal-900 font-medium">{formData.email}</p>
                                                                      </div>
                                                                      <div className={`flex items-center px-2 py-1 rounded-lg text-xs font-medium ${formData.emailVerified
                                                                           ? 'bg-green-100 text-green-700 border border-green-200'
                                                                           : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                                           }`}>
                                                                           {formData.emailVerified ? (
                                                                                <>
                                                                                     <CheckCircle className="w-3 h-3 mr-1" />
                                                                                     Đã xác thực
                                                                                </>
                                                                           ) : (
                                                                                <>
                                                                                     <AlertCircle className="w-3 h-3 mr-1" />
                                                                                     Chưa xác thực
                                                                                </>
                                                                           )}
                                                                      </div>
                                                                 </div>
                                                                 {!formData.emailVerified && (
                                                                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                                           <p className="text-yellow-800 text-xs">
                                                                                Email chưa được xác thực qua OTP. Vui lòng kiểm tra email để xác thực.
                                                                           </p>
                                                                      </div>
                                                                 )}
                                                            </div>
                                                       </div>
                                                       <div className="space-y-2">
                                                            <label className="flex items-center text-sm font-semibold text-teal-800 mb-2">
                                                                 <Phone className="w-4 h-4 mr-2 text-teal-600" />
                                                                 Số điện thoại
                                                            </label>
                                                            {isEditing ? (
                                                                 <Input
                                                                      value={formData.phone}
                                                                      onChange={(e) => handleInputChange('phone', e.target.value)}
                                                                      placeholder="Nhập số điện thoại"
                                                                      className="rounded-xl border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                                                                 />
                                                            ) : (
                                                                 <div className="p-3 bg-teal-50 rounded-xl">
                                                                      <div className="flex items-center">
                                                                           <Phone className="w-4 h-4 mr-2 text-teal-600" />
                                                                           <p className="text-teal-900 font-medium">{formData.phone || "Chưa cập nhật"}</p>
                                                                      </div>
                                                                 </div>
                                                            )}
                                                       </div>
                                                       <div className="space-y-2">
                                                            <label className="flex items-center text-sm font-semibold text-teal-800 mb-2">
                                                                 <Calendar className="w-4 h-4 mr-2 text-teal-600" />
                                                                 Ngày sinh
                                                            </label>
                                                            {isEditing ? (
                                                                 <Input
                                                                      type="date"
                                                                      value={formData.dateOfBirth}
                                                                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                                                      className="rounded-xl border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                                                                 />
                                                            ) : (
                                                                 <div className="p-3 bg-teal-50 rounded-xl">
                                                                      <p className="text-teal-900 font-medium">{formData.dateOfBirth ? formatDate(formData.dateOfBirth) : "Chưa cập nhật"}</p>
                                                                 </div>
                                                            )}
                                                       </div>
                                                       <div className="space-y-2">
                                                            <label className="flex items-center text-sm font-semibold text-teal-800 mb-2">
                                                                 <Heart className="w-4 h-4 mr-2 text-teal-600" />
                                                                 Giới tính
                                                            </label>
                                                            {isEditing ? (
                                                                 <Select
                                                                      value={formData.gender}
                                                                      onValueChange={(value) => handleInputChange('gender', value)}
                                                                 >
                                                                      <SelectTrigger className="rounded-xl border-teal-200 focus:border-teal-500 focus:ring-teal-500">
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
                                                                 <div className="p-3 bg-teal-50 rounded-xl">
                                                                      <p className="text-teal-900 font-medium">{formData.gender || "Chưa cập nhật"}</p>
                                                                 </div>
                                                            )}
                                                       </div>
                                                       <div className="space-y-2">
                                                            <label className="flex items-center text-sm font-semibold text-teal-800 mb-2">
                                                                 <Star className="w-4 h-4 mr-2 text-teal-600" />
                                                                 Trình độ
                                                            </label>
                                                            {isEditing ? (
                                                                 <Select
                                                                      value={formData.skillLevel}
                                                                      onValueChange={(value) => handleInputChange('skillLevel', value)}
                                                                 >
                                                                      <SelectTrigger className="rounded-xl border-teal-200 focus:border-teal-500 focus:ring-teal-500">
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
                                                                 <div className="p-3 bg-teal-50 rounded-xl">
                                                                      <p className="text-teal-900 font-medium">
                                                                           {formData.skillLevel ? skillLevels.find(s => s.value === formData.skillLevel)?.label : "Chưa cập nhật"}
                                                                      </p>
                                                                 </div>
                                                            )}
                                                       </div>
                                                  </div>
                                                  <div className="space-y-2">
                                                       <label className="flex items-center text-sm font-semibold text-teal-800 mb-2">
                                                            <MapPin className="w-4 h-4 mr-2 text-teal-600" />
                                                            Địa chỉ
                                                       </label>
                                                       {isEditing ? (
                                                            <Textarea
                                                                 value={formData.address}
                                                                 onChange={(e) => handleInputChange('address', e.target.value)}
                                                                 placeholder="Nhập địa chỉ"
                                                                 rows={3}
                                                                 className="rounded-xl border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                                                            />
                                                       ) : (
                                                            <div className="p-3 bg-teal-50 rounded-xl">
                                                                 <div className="flex items-start">
                                                                      <MapPin className="w-4 h-4 mr-2 text-teal-600 mt-1" />
                                                                      <p className="text-teal-900 font-medium">{formData.address || "Chưa cập nhật"}</p>
                                                                 </div>
                                                            </div>
                                                       )}
                                                  </div>
                                             </CardContent>
                                        </Card>
                                   </SlideIn>

                                   {/* Football Preferences */}
                                   <SlideIn direction="right" delay={200}>
                                        <Card className="border-2 border-teal-300 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-xl">
                                             <CardHeader className="bg-gradient-to-r py-3 px-5 from-teal-50 to-teal-100 rounded-t-2xl">
                                                  <CardTitle className="flex items-center text-teal-900">
                                                       <div className="p-2 bg-teal-200 rounded-xl mr-3">
                                                            <Target className="w-5 h-5 text-teal-700" />
                                                       </div>
                                                       Sở thích bóng đá
                                                  </CardTitle>
                                             </CardHeader>
                                             <CardContent className="space-y-6 p-6">
                                                  <div className="space-y-2">
                                                       <label className="flex items-center text-sm font-semibold text-teal-800 mb-2">
                                                            <Users className="w-4 h-4 mr-2 text-teal-600" />
                                                            Vị trí ưa thích
                                                       </label>
                                                       {isEditing ? (
                                                            <Select
                                                                 value={formData.preferredPositions}
                                                                 onValueChange={(value) => handleInputChange('preferredPositions', value)}
                                                            >
                                                                 <SelectTrigger className="rounded-xl border-teal-200 focus:border-teal-500 focus:ring-teal-500">
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
                                                            <div className="p-3 bg-teal-50 rounded-xl">
                                                                 <p className="text-teal-900 font-medium">{formData.preferredPositions || "Chưa cập nhật"}</p>
                                                            </div>
                                                       )}
                                                  </div>
                                                  <div className="space-y-2">
                                                       <label className="flex items-center text-sm font-semibold text-teal-800 mb-2">
                                                            <Heart className="w-4 h-4 mr-2 text-teal-600" />
                                                            Giới thiệu bản thân
                                                       </label>
                                                       {isEditing ? (
                                                            <Textarea
                                                                 value={formData.bio}
                                                                 onChange={(e) => handleInputChange('bio', e.target.value)}
                                                                 placeholder="Viết một chút về bản thân..."
                                                                 rows={4}
                                                                 className="rounded-xl border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                                                            />
                                                       ) : (
                                                            <div className="p-3 bg-teal-50 rounded-xl">
                                                                 <p className="text-teal-900 font-medium">{formData.bio || "Chưa cập nhật"}</p>
                                                            </div>
                                                       )}
                                                  </div>
                                             </CardContent>
                                        </Card>
                                   </SlideIn>

                                   {/* Account Information */}
                                   <SlideIn direction="right" delay={300}>
                                        <Card className="border-2 shadow-lg bg-white/90 border-teal-300 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-xl">
                                             <CardHeader className="bg-gradient-to-r py-3 px-5 from-teal-50 to-teal-100 rounded-t-2xl">
                                                  <CardTitle className="flex items-center text-teal-900">
                                                       <div className="p-2 bg-teal-200 rounded-xl mr-3">
                                                            <Shield className="w-5 h-5 text-teal-700" />
                                                       </div>
                                                       Thông tin tài khoản
                                                  </CardTitle>
                                             </CardHeader>
                                             <CardContent className="space-y-6 p-6">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                       <div className="space-y-2">
                                                            <label className="flex items-center text-sm font-semibold text-teal-800 mb-2">
                                                                 <Shield className="w-4 h-4 mr-2 text-teal-600" />
                                                                 Trạng thái tài khoản
                                                            </label>
                                                            <div className="p-1 rounded-xl">
                                                                 <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium ${formData.status === 'Active'
                                                                      ? 'bg-green-100 text-green-800 border border-green-200'
                                                                      : 'bg-red-100 text-red-800 border border-red-200'
                                                                      }`}>
                                                                      <Shield className="w-4 h-4 mr-2" />
                                                                      {formData.status === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
                                                                 </span>
                                                            </div>
                                                       </div>
                                                       <div className="space-y-2">
                                                            <label className="flex items-center text-sm font-semibold text-teal-800 mb-2">
                                                                 <Clock className="w-4 h-4 mr-2 text-teal-600" />
                                                                 Ngày tạo tài khoản
                                                            </label>
                                                            <div className="p-3 bg-green-50 rounded-xl">
                                                                 <p className="text-green-900 font-medium">{formatDate(formData.createdAt)}</p>
                                                            </div>
                                                       </div>
                                                  </div>
                                             </CardContent>
                                        </Card>
                                   </SlideIn>
                              </div>
                         </FadeIn>
                    </div>
               </Container>
          </div>
     );
}
