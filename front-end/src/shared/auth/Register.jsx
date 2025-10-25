import { useState } from 'react';
import { authService, validateRegistrationData, formatRegistrationData } from '../services/authService';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui';
import { Eye, EyeOff, Mail, Lock, User, Phone, X, Camera, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ErrorDisplay from '../components/ErrorDisplay';

export default function Register({ onDone, onGoLogin, compact = false }) {
     const { login } = useAuth();
     const [step, setStep] = useState('form'); // form | otp | success
     const [email, setEmail] = useState('');
     const [fullName, setFullName] = useState('');
     const [password, setPassword] = useState('');
     const [roleName, setRoleName] = useState('Player');
     const [phone, setPhone] = useState('');
     const [avatar, setAvatar] = useState(null);
     const [otp, setOtp] = useState('');
     const [error, setError] = useState('');
     const [emailError, setEmailError] = useState('');
     const [fullNameError, setFullNameError] = useState('');
     const [passwordError, setPasswordError] = useState('');
     const [phoneError, setPhoneError] = useState('');
     const [roleNameError, setRoleNameError] = useState('');
     const [info, setInfo] = useState('');
     const [showPassword, setShowPassword] = useState(false);
     const [isLoading, setIsLoading] = useState(false);
     const [avatarPreview, setAvatarPreview] = useState(null);

     async function handleSubmit(e) {
          e.preventDefault();
          setError('');
          setIsLoading(true);

          // Validate form data
          const formData = {
               email,
               fullName,
               password,
               phone,
               roleName,
               avatar
          };

          const validation = validateRegistrationData(formData);
          if (!validation.isValid) {
               setEmailError(validation.errors.email || '');
               setFullNameError(validation.errors.fullName || '');
               setPasswordError(validation.errors.password || '');
               setPhoneError(validation.errors.phone || '');
               setRoleNameError(validation.errors.roleName || '');
               setIsLoading(false);
               return;
          }

          // Clear previous errors
          setEmailError('');
          setFullNameError('');
          setPasswordError('');
          setPhoneError('');
          setRoleNameError('');

          try {
               const formattedData = formatRegistrationData(formData);
               const result = await authService.registerUser(formattedData);

               if (!result.ok) {
                    // Hiển thị lỗi chi tiết từ API
                    let errorMessage = result.reason || 'Đăng ký thất bại';

                    // Xử lý các loại lỗi phổ biến
                    if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
                         errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin';
                    } else if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
                         if (errorMessage.includes('email') || errorMessage.includes('Email')) {
                              errorMessage = 'Email này đã được sử dụng. Vui lòng chọn email khác';
                         } else if (errorMessage.includes('phone') || errorMessage.includes('Phone')) {
                              errorMessage = 'Số điện thoại này đã được sử dụng. Vui lòng chọn số khác';
                         } else {
                              errorMessage = 'Thông tin đã tồn tại trong hệ thống';
                         }
                    } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
                         errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau';
                    } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
                         errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet';
                    }

                    setError(errorMessage);
                    setIsLoading(false);
                    return;
               }

               // Nếu đăng ký với role Owner, tạo owner registration request
               if (formData.roleName === 'Owner') {
                    try {
                         const { createOwnerRegistrationRequest } = await import('../services/ownerRegistrationRequests');
                         await createOwnerRegistrationRequest({
                              userId: result.user?.userID || Date.now(), // Fallback ID
                              businessName: `${formData.fullName} - Sân bóng`,
                              businessType: "Sports Complex",
                              contactPerson: formData.fullName,
                              email: formData.email,
                              phone: formData.phone,
                              address: "Địa chỉ sẽ được cập nhật sau",
                              businessLicense: "Đang chờ cập nhật",
                              taxCode: "Đang chờ cập nhật",
                              description: "Yêu cầu đăng ký chủ sân từ hệ thống",
                              documents: []
                         });

                         setInfo('Đăng ký thành công! Yêu cầu đăng ký chủ sân đã được gửi đến admin để duyệt. Vui lòng kiểm tra email để lấy mã OTP.');
                    } catch (ownerRequestError) {
                         console.error('Error creating owner registration request:', ownerRequestError);
                         setInfo('Đăng ký thành công! Tuy nhiên, có lỗi khi tạo yêu cầu đăng ký chủ sân. Vui lòng liên hệ admin. Vui lòng kiểm tra email để lấy mã OTP.');
                    }
               } else {
                    setInfo(result.message || 'Đăng ký thành công, vui lòng kiểm tra email để lấy mã OTP');
               }

               setStep('otp');
          } catch (error) {
               // Hiển thị lỗi chi tiết từ exception
               const errorMessage = error.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.';
               setError(errorMessage);
               console.error('Registration error:', error);
          }

          setIsLoading(false);
     }

     async function handleVerifyOtp(e) {
          e.preventDefault();
          setError('');
          setIsLoading(true);

          try {
               const result = await authService.verifyOtp(email, otp);
               if (!result.ok) {
                    // Hiển thị lỗi chi tiết từ API
                    const errorMessage = result.reason || 'Xác thực OTP thất bại';
                    setError(errorMessage);
                    setIsLoading(false);
                    return;
               }

               // Store user data and token
               if (result.user) {
                    localStorage.setItem('user', JSON.stringify(result.user));
                    login(result.user, result.token);
               }

               setStep('success');
          } catch (error) {
               // Hiển thị lỗi chi tiết từ exception
               const errorMessage = error.message || 'Có lỗi xảy ra khi xác thực OTP. Vui lòng thử lại.';
               setError(errorMessage);
               console.error('OTP verification error:', error);
          }

          setIsLoading(false);
     }

     function maskEmail(email) {
          const [local, domain] = email.split('@');
          return `${local.slice(0, 2)}***@${domain}`;
     }

     function handleAvatarChange(e) {
          const file = e.target.files[0];
          if (file) {
               // Validate file type
               if (!file.type.startsWith('image/')) {
                    setError('Vui lòng chọn file ảnh hợp lệ');
                    return;
               }

               // Validate file size (max 5MB)
               if (file.size > 5 * 1024 * 1024) {
                    setError('Kích thước file không được vượt quá 5MB');
                    return;
               }

               setAvatar(file);

               // Create preview
               const reader = new FileReader();
               reader.onload = (e) => {
                    setAvatarPreview(e.target.result);
               };
               reader.readAsDataURL(file);
          }
     }

     function removeAvatar() {
          setAvatar(null);
          setAvatarPreview(null);
     }

     async function handleResendOtp() {
          setError('');
          setIsLoading(true);

          try {
               const result = await authService.resendOtp(email);
               if (!result.ok) {
                    // Hiển thị lỗi chi tiết từ API
                    const errorMessage = result.reason || 'Gửi lại OTP thất bại';
                    setError(errorMessage);
               } else {
                    setInfo(result.message || 'Mã OTP đã được gửi lại');
               }
          } catch (error) {
               // Hiển thị lỗi chi tiết từ exception
               const errorMessage = error.message || 'Có lỗi xảy ra khi gửi lại OTP. Vui lòng thử lại.';
               setError(errorMessage);
               console.error('Resend OTP error:', error);
          }

          setIsLoading(false);
     }

     return (
          <div className={compact ? "" : "max-w-sm mx-auto p-4"}>
               {error && (
                    <ErrorDisplay
                         type="error"
                         title={
                              step === 'form' ? 'Lỗi đăng ký' :
                                   step === 'otp' ? 'Lỗi xác thực OTP' : 'Lỗi'
                         }
                         message={error}
                         onClose={() => setError('')}
                    />
               )}

               {info && (
                    <ErrorDisplay
                         type="success"
                         title="Thành công"
                         message={info}
                    />
               )}

               {step === 'form' && (
                    <Card className={`${compact ? "" : "shadow-lg border-0 bg-white/95 backdrop-blur-sm"} transition-all duration-300 hover:shadow-xl`}>
                         <CardHeader className="text-center pb-4">
                              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-3">
                                   <User className="w-6 h-6 text-white" />
                              </div>
                              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                   Đăng ký
                              </CardTitle>
                              <CardDescription className="text-sm text-slate-600">
                                   Tạo tài khoản BallSpot mới
                              </CardDescription>
                         </CardHeader>

                         <CardContent className="space-y-4">
                              <form onSubmit={handleSubmit} className="space-y-4">
                                   <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Email *</label>
                                        <div className="relative">
                                             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                             <Input
                                                  value={email}
                                                  onChange={(e) => setEmail(e.target.value)}
                                                  onBlur={() => setEmailError(!email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Email không hợp lệ')}
                                                  required
                                                  type="email"
                                                  className={`pl-9 h-10 text-sm ${emailError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                                  placeholder="you@example.com"
                                             />
                                        </div>
                                        {emailError && <p className="text-xs text-red-600 flex items-center gap-1">
                                             <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                                             {emailError}
                                        </p>}
                                   </div>

                                   <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Họ và tên *</label>
                                        <div className="relative">
                                             <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                             <Input
                                                  value={fullName}
                                                  onChange={(e) => setFullName(e.target.value)}
                                                  onBlur={() => setFullNameError(!fullName || fullName.trim().length < 2 ? 'Họ tên phải có ít nhất 2 ký tự' : '')}
                                                  required
                                                  className={`pl-9 h-10 text-sm ${fullNameError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                                  placeholder="Nhập họ và tên"
                                             />
                                        </div>
                                        {fullNameError && <p className="text-xs text-red-600 flex items-center gap-1">
                                             <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                                             {fullNameError}
                                        </p>}
                                   </div>

                                   <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Số điện thoại *</label>
                                        <div className="relative">
                                             <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                             <Input
                                                  value={phone}
                                                  onChange={(e) => setPhone(e.target.value)}
                                                  onBlur={() => setPhoneError(!phone || !/^[0-9]{10,11}$/.test(phone.replace(/\s/g, '')) ? 'Số điện thoại không hợp lệ' : '')}
                                                  required
                                                  className={`pl-9 h-10 text-sm ${phoneError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                                  placeholder="0123456789"
                                             />
                                        </div>
                                        {phoneError && <p className="text-xs text-red-600 flex items-center gap-1">
                                             <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                                             {phoneError}
                                        </p>}
                                   </div>

                                   <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Mật khẩu *</label>
                                        <div className="relative">
                                             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                             <Input
                                                  value={password}
                                                  onChange={(e) => setPassword(e.target.value)}
                                                  onBlur={() => setPasswordError(!password || password.length < 6 ? 'Mật khẩu phải có ít nhất 6 ký tự' : '')}
                                                  required
                                                  type={showPassword ? "text" : "password"}
                                                  className={`pl-9 pr-9 h-10 text-sm ${passwordError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                                  placeholder="••••••••"
                                             />
                                             <Button
                                                  type="button"
                                                  onClick={() => setShowPassword(!showPassword)}
                                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0 h-auto bg-transparent border-0 hover:bg-transparent"
                                             >
                                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                             </Button>
                                        </div>
                                        {passwordError && <p className="text-xs text-red-600 flex items-center gap-1">
                                             <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                                             {passwordError}
                                        </p>}
                                   </div>

                                   <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Vai trò *</label>
                                        <Select value={roleName} onValueChange={setRoleName}>
                                             <SelectTrigger className={`h-10 text-sm ${roleNameError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}>
                                                  <SelectValue placeholder="Chọn vai trò" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  <SelectItem value="Player">Người chơi</SelectItem>
                                                  <SelectItem value="Owner">Chủ sân</SelectItem>
                                             </SelectContent>
                                        </Select>
                                        {roleNameError && <p className="text-xs text-red-600 flex items-center gap-1">
                                             <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                                             {roleNameError}
                                        </p>}
                                   </div>

                                   <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Ảnh đại diện (tùy chọn)</label>
                                        <div className="space-y-2">
                                             {avatarPreview ? (
                                                  <div className="relative w-20 h-20 mx-auto">
                                                       <img
                                                            src={avatarPreview}
                                                            alt="Avatar preview"
                                                            className="w-full h-full object-cover rounded-lg border-2 border-slate-200"
                                                       />
                                                       <Button
                                                            type="button"
                                                            onClick={removeAvatar}
                                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors p-0"
                                                       >
                                                            <X className="w-3 h-3" />
                                                       </Button>
                                                  </div>
                                             ) : (
                                                  <div className="flex items-center justify-center w-full">
                                                       <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                 <Camera className="w-6 h-6 mb-2 text-slate-400" />
                                                                 <p className="text-xs text-slate-500">Chọn ảnh đại diện</p>
                                                            </div>
                                                            <input
                                                                 type="file"
                                                                 accept="image/*"
                                                                 onChange={handleAvatarChange}
                                                                 className="hidden"
                                                            />
                                                       </label>
                                                  </div>
                                             )}
                                        </div>
                                        <p className="text-xs text-gray-500">Kích thước tối đa 5MB, định dạng JPG, PNG</p>
                                   </div>


                                   <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3 h-3" required />
                                        <span>Tôi đồng ý với <Button type="button" className="text-teal-600 hover:underline p-0 h-auto bg-transparent border-0 hover:bg-transparent">Điều khoản</Button></span>
                                   </div>

                                   <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-10 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        {isLoading ? (
                                             <div className="flex items-center gap-2">
                                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                  Đang đăng ký...
                                             </div>
                                        ) : (
                                             'Tạo tài khoản'
                                        )}
                                   </Button>
                              </form>

                              <div className="text-center">
                                   <p className="text-xs text-slate-600">
                                        Đã có tài khoản?{' '}
                                        <Button
                                             onClick={onGoLogin}
                                             className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-colors p-0 h-auto bg-transparent border-0 hover:bg-transparent"
                                        >
                                             Đăng nhập ngay
                                        </Button>
                                   </p>
                              </div>
                         </CardContent>
                    </Card>
               )}

               {step === 'otp' && (
                    <Card className={`${compact ? "" : "shadow-lg border-0 bg-white/95 backdrop-blur-sm"} transition-all duration-300 hover:shadow-xl`}>
                         <CardHeader className="text-center pb-4">
                              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3">
                                   <CheckCircle className="w-6 h-6 text-white" />
                              </div>
                              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                   Xác thực OTP
                              </CardTitle>
                              <CardDescription className="text-sm text-slate-600">
                                   Nhập mã OTP được gửi tới: <span className="font-medium text-slate-900">{email ? maskEmail(email) : 'email của bạn'}</span>
                              </CardDescription>
                         </CardHeader>

                         <CardContent className="space-y-4">
                              <form onSubmit={handleVerifyOtp} className="space-y-4">
                                   <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Mã OTP</label>
                                        <Input
                                             value={otp}
                                             onChange={(e) => setOtp(e.target.value)}
                                             required
                                             className="h-10 text-center text-lg tracking-widest focus:ring-green-500 focus:border-green-500"
                                             placeholder="Nhập mã 6 số"
                                             maxLength="6"
                                        />
                                   </div>

                                   <div className="space-y-3">
                                        <Button
                                             type="submit"
                                             disabled={isLoading}
                                             className="w-full h-10 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                             {isLoading ? (
                                                  <div className="flex items-center gap-2">
                                                       <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                       Đang xác thực...
                                                  </div>
                                             ) : (
                                                  'Xác nhận OTP'
                                             )}
                                        </Button>

                                        <div className="text-center">
                                             <p className="text-xs text-slate-600 mb-2">Không nhận được mã?</p>
                                             <Button
                                                  type="button"
                                                  onClick={handleResendOtp}
                                                  disabled={isLoading}
                                                  className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors p-0 h-auto bg-transparent border-0 hover:bg-transparent text-sm"
                                             >
                                                  Gửi lại mã OTP
                                             </Button>
                                        </div>
                                   </div>
                              </form>
                         </CardContent>
                    </Card>
               )}

               {step === 'success' && (
                    <Card className={`${compact ? "" : "shadow-lg border-0 bg-white/95 backdrop-blur-sm"} transition-all duration-300 hover:shadow-xl`}>
                         <CardHeader className="text-center pb-4">
                              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3">
                                   <CheckCircle className="w-6 h-6 text-white" />
                              </div>
                              <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                                   Thành công!
                              </CardTitle>
                              <CardDescription className="text-sm text-slate-600">
                                   Tài khoản đã được tạo thành công
                              </CardDescription>
                         </CardHeader>

                         <CardContent className="space-y-4">
                              <div className="text-center space-y-3">
                                   <p className="text-sm text-slate-600">Bạn có thể đăng nhập ngay để bắt đầu sử dụng BallSpot</p>
                                   <Button
                                        onClick={() => (onDone ? onDone() : (onGoLogin && onGoLogin()))}
                                        className="w-full h-10 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                   >
                                        Đăng nhập ngay
                                   </Button>
                              </div>
                         </CardContent>
                    </Card>
               )}
          </div>
     );
}