import { useState, useEffect } from 'react';
import { authService, validateRegistrationData, formatRegistrationData, validateVietnamPhone, validateStrongPassword } from '../services/authService';
import { Button, Input, PhoneInput, Card, CardContent, CardHeader, CardTitle, CardDescription, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '../components/ui';
import { FadeIn, SlideIn, ScaleIn } from '../components/ui/animations';
import { Eye, EyeOff, Mail, Lock, User, Phone, X, Camera, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

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
     const [emailError, setEmailError] = useState('');
     const [fullNameError, setFullNameError] = useState('');
     const [passwordError, setPasswordError] = useState('');
     const [phoneError, setPhoneError] = useState('');
     const [roleNameError, setRoleNameError] = useState('');
     const [showPassword, setShowPassword] = useState(false);
     const [isLoading, setIsLoading] = useState(false);
     const [avatarPreview, setAvatarPreview] = useState(null);
     const [countdown, setCountdown] = useState(0);

     async function handleSubmit(e) {
          e.preventDefault();
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
                         errorMessage = 'Vui lòng nhập đầy đủ các thông tin';
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

                    Swal.fire({
                         icon: 'error',
                         title: 'Đăng ký thất bại',
                         text: errorMessage,
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#ef4444'
                    });
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

                         Swal.fire({
                              icon: 'success',
                              title: 'Đăng ký thành công!',
                              text: 'Bạn đã đăng kí thành công với vai trò chủ sân. Vui lòng kiểm tra email để lấy mã OTP.',
                              confirmButtonText: 'Đóng',
                              confirmButtonColor: '#10b981'
                         });
                    } catch (ownerRequestError) {
                         console.error('Error creating owner registration request:', ownerRequestError);
                         Swal.fire({
                              icon: 'warning',
                              title: 'Đăng ký thành công!',
                              text: 'Tuy nhiên, có lỗi khi tạo yêu cầu đăng ký chủ sân. Vui lòng liên hệ admin. Vui lòng kiểm tra email để lấy mã OTP.',
                              confirmButtonText: 'Đóng',
                              confirmButtonColor: '#f59e0b'
                         });
                    }
               } else {
                    Swal.fire({
                         icon: 'success',
                         title: 'Đăng ký thành công!',
                         text: result.message || 'Vui lòng kiểm tra email để lấy mã OTP',
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#10b981'
                    });
               }

               setStep('otp');
          } catch (error) {
               // Hiển thị lỗi chi tiết từ exception
               const errorMessage = error.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.';
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi đăng ký',
                    text: errorMessage,
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#ef4444'
               });
               console.error('Registration error:', error);
          }

          setIsLoading(false);
     }

     // OTP Input handler
     const handleOtpChange = (value) => {
          setOtp(value);
     };

     // Countdown timer for resend OTP
     useEffect(() => {
          if (countdown > 0) {
               const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
               return () => clearTimeout(timer);
          }
     }, [countdown]);

     async function handleVerifyOtp(e) {
          e.preventDefault();

          if (otp.length !== 6) {
               Swal.fire({
                    icon: 'warning',
                    title: 'Mã OTP không đầy đủ',
                    text: 'Vui lòng nhập đầy đủ 6 số OTP',
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#f59e0b'
               });
               return;
          }

          setIsLoading(true);

          try {
               const result = await authService.verifyOtp(email, otp);
               if (!result.ok) {
                    // Hiển thị lỗi chi tiết từ API
                    const errorMessage = result.reason || 'Xác thực OTP thất bại';
                    Swal.fire({
                         icon: 'error',
                         title: 'Xác thực OTP thất bại',
                         text: errorMessage,
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#ef4444'
                    });
                    // Reset OTP on error
                    setOtp('');
                    setIsLoading(false);
                    return;
               }

               // Store user data and token
               if (result.user) {
                    localStorage.setItem('user', JSON.stringify(result.user));
                    login(result.user, result.token);
               }

               Swal.fire({
                    icon: 'success',
                    title: 'Xác thực thành công!',
                    text: 'Tài khoản của bạn đã được kích hoạt.',
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#10b981'
               }).then(() => {
                    setStep('success');
               });
          } catch (error) {
               // Hiển thị lỗi chi tiết từ exception
               const errorMessage = error.message || 'Có lỗi xảy ra khi xác thực OTP. Vui lòng thử lại.';
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi xác thực OTP',
                    text: errorMessage,
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#ef4444'
               });
               // Reset OTP on error
               setOtp('');
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
          setIsLoading(true);

          try {
               const result = await authService.resendOtp(email);
               if (!result.ok) {
                    // Hiển thị lỗi chi tiết từ API
                    const errorMessage = result.reason || 'Gửi lại OTP thất bại';
                    Swal.fire({
                         icon: 'error',
                         title: 'Gửi lại OTP thất bại',
                         text: errorMessage,
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#ef4444'
                    });
               } else {
                    Swal.fire({
                         icon: 'success',
                         title: 'Đã gửi lại mã OTP',
                         text: result.message || 'Mã OTP đã được gửi lại đến email của bạn',
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#10b981'
                    });
                    setCountdown(60); // Start 60 second countdown
                    // Reset OTP inputs
                    setOtp('');
               }
          } catch (error) {
               // Hiển thị lỗi chi tiết từ exception
               const errorMessage = error.message || 'Có lỗi xảy ra khi gửi lại OTP. Vui lòng thử lại.';
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi gửi lại OTP',
                    text: errorMessage,
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#ef4444'
               });
               console.error('Resend OTP error:', error);
          }

          setIsLoading(false);
     }

     // Set countdown when step changes to OTP
     useEffect(() => {
          if (step === 'otp') {
               setCountdown(60);
          }
     }, [step]);

     return (
          <div className={compact ? "" : "max-w-sm mx-auto p-4"}>
               {step === 'form' && (
                    <SlideIn direction="up" delay={0} duration={0.4}>
                         <div className="w-full">
                              {/* Welcome Section */}
                              <div className="mb-3">
                                   <FadeIn delay={100} duration={0.4}>
                                        <h1 className="text-4xl sm:text-5xl text-center font-bold text-teal-700 mb-2 leading-tight">
                                             Khám phá thế giới bóng đá
                                        </h1>
                                   </FadeIn>
                                   <FadeIn delay={200} duration={0.4}>
                                        <p className="text-base text-gray-500 leading-relaxed max-w-md">
                                             Tạo tài khoản mới để bắt đầu hành trình khám phá những sân bóng tuyệt vời cùng BallSpot.
                                        </p>
                                   </FadeIn>
                              </div>

                              {/* Form (no internal scroll) */}
                              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                                   <FadeIn delay={500} duration={0.4}>
                                        <div className="space-y-1.5 lg:col-span-1">
                                             <label className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                                             <div className="relative">
                                                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors" />
                                                  <Input
                                                       value={email}
                                                       onChange={(e) => setEmail(e.target.value)}
                                                       onBlur={() => setEmailError(!email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Email không hợp lệ')}
                                                       required
                                                       type="email"
                                                       className={`pl-12 h-12 text-sm transition-all duration-200 rounded-2xl border-gray-200 ${emailError ? 'border-red-500 focus:ring-red-500 animate-shake' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                                       placeholder="you@example.com"
                                                  />
                                             </div>
                                             {emailError && (
                                                  <FadeIn delay={0} duration={0.2}>
                                                       <p className="text-xs text-red-600 flex items-center gap-1">
                                                            <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                                                            {emailError}
                                                       </p>
                                                  </FadeIn>
                                             )}
                                        </div>
                                   </FadeIn>

                                   <FadeIn delay={600} duration={0.4}>
                                        <div className="space-y-1.5 lg:col-span-1">
                                             <label className="text-sm font-medium text-gray-700">Họ và tên <span className="text-red-500">*</span></label>
                                             <div className="relative">
                                                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors" />
                                                  <Input
                                                       value={fullName}
                                                       onChange={(e) => setFullName(e.target.value)}
                                                       onBlur={() => setFullNameError(!fullName || fullName.trim().length < 2 ? 'Họ tên phải có ít nhất 2 ký tự' : '')}
                                                       required
                                                       className={`pl-12 h-12 text-sm transition-all duration-200 rounded-2xl border-gray-200 ${fullNameError ? 'border-red-500 focus:ring-red-500 animate-shake' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                                       placeholder="Nhập họ và tên"
                                                  />
                                             </div>
                                             {fullNameError && (
                                                  <FadeIn delay={0} duration={0.2}>
                                                       <p className="text-xs text-red-600 flex items-center gap-1">
                                                            <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                                                            {fullNameError}
                                                       </p>
                                                  </FadeIn>
                                             )}
                                        </div>
                                   </FadeIn>

                                   <FadeIn delay={700} duration={0.4}>
                                        <div className="space-y-1.5 lg:col-span-1">
                                             <label className="text-sm font-medium text-gray-700">Số điện thoại <span className="text-red-500">*</span></label>
                                             <div className="relative">
                                                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors" />
                                                  <PhoneInput
                                                       value={phone}
                                                       onChange={(e) => setPhone(e.target.value)}
                                                       onBlur={() => { const v = validateVietnamPhone(phone); setPhoneError(v.isValid ? '' : v.message); }}
                                                       required
                                                       maxLength={10}
                                                       className={`pl-12 h-12 text-sm transition-all duration-200 rounded-2xl border-gray-200 ${phoneError ? 'border-red-500 focus:ring-red-500 animate-shake' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                                       placeholder="0123456789"
                                                  />
                                             </div>
                                             {phoneError && (
                                                  <FadeIn delay={0} duration={0.2}>
                                                       <p className="text-xs text-red-600 flex items-center gap-1">
                                                            <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                                                            {phoneError}
                                                       </p>
                                                  </FadeIn>
                                             )}
                                        </div>
                                   </FadeIn>

                                   <FadeIn delay={800} duration={0.4}>
                                        <div className="space-y-1.5 lg:col-span-1">
                                             <label className="text-sm font-medium text-gray-700">Mật khẩu <span className="text-red-500">*</span></label>
                                             <div className="relative">
                                                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors" />
                                                  <Input
                                                       value={password}
                                                       onChange={(e) => setPassword(e.target.value)}
                                                       onBlur={() => { const v = validateStrongPassword(password); setPasswordError(v.isValid ? '' : v.message); }}
                                                       required
                                                       type={showPassword ? "text" : "password"}
                                                       className={`pl-12 pr-12 h-12 text-sm transition-all duration-200 rounded-2xl border-gray-200 ${passwordError ? 'border-red-500 focus:ring-red-500 animate-shake' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                                       placeholder="••••••••"
                                                  />
                                                  <Button
                                                       type="button"
                                                       onClick={() => setShowPassword(!showPassword)}
                                                       className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200 p-0 h-auto bg-transparent border-0 hover:bg-transparent"
                                                  >
                                                       {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                  </Button>
                                             </div>
                                             {passwordError && (
                                                  <FadeIn delay={0} duration={0.2}>
                                                       <p className="text-xs text-red-600 flex items-center gap-1">
                                                            <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                                                            {passwordError}
                                                       </p>
                                                  </FadeIn>
                                             )}
                                        </div>
                                   </FadeIn>

                                   <FadeIn delay={900} duration={0.4}>
                                        <div className="space-y-1.5 lg:col-span-2">
                                             <label className="text-sm font-medium text-gray-700">Vai trò <span className="text-red-500">*</span></label>
                                             <Select value={roleName} onValueChange={setRoleName}>
                                                  <SelectTrigger className={`h-12 text-sm transition-all duration-200 rounded-2xl border-gray-200 ${roleNameError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}>
                                                       <SelectValue placeholder="Chọn vai trò" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       <SelectItem value="Player">Người chơi</SelectItem>
                                                       <SelectItem value="Owner">Chủ sân</SelectItem>
                                                  </SelectContent>
                                             </Select>
                                             {roleNameError && (
                                                  <FadeIn delay={0} duration={0.2}>
                                                       <p className="text-xs text-red-600 flex items-center gap-1">
                                                            <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                                                            {roleNameError}
                                                       </p>
                                                  </FadeIn>
                                             )}
                                        </div>
                                   </FadeIn>

                                   <FadeIn delay={1000} duration={0.4}>
                                        <div className="space-y-1.5 lg:col-span-2">
                                             <label className="text-sm font-medium text-gray-700">Ảnh đại diện (tùy chọn)</label>
                                             <div className="flex items-center gap-3">
                                                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                                                       {avatarPreview ? (
                                                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                                       ) : (
                                                            <Camera className="w-5 h-5 text-slate-400" />
                                                       )}
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                       <label className="inline-flex items-center justify-center p-1 border border-slate-300 rounded-2xl text-xs bg-white hover:bg-slate-50 cursor-pointer">
                                                            Chọn ảnh
                                                            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                                       </label>
                                                       {avatarPreview && (
                                                            <div className="p-1 rounded-full border border-red-500 hover:bg-red-600 text-white cursor-pointer" onClick={removeAvatar}>
                                                                 <X className="w-4 h-4 text-red-500 hover:text-white" />
                                                            </div>

                                                       )}
                                                  </div>
                                             </div>
                                             <p className="text-xs text-gray-500">Tối đa 5MB, JPG/PNG</p>
                                        </div>
                                   </FadeIn>

                                   <FadeIn delay={1100} duration={0.4}>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 lg:col-span-2">
                                             <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4 transition-all duration-200 hover:scale-110" required />
                                             <span>Tôi đồng ý với <Button type="button" className="text-teal-600 underline p-0 h-auto bg-transparent border-0 hover:bg-transparent transition-all hover:text-teal-800 duration-200 text-sm"><Link to="/terms-of-service">Điều khoản</Link></Button></span>
                                        </div>
                                   </FadeIn>

                                   <FadeIn delay={1200} duration={0.4}>
                                        <Button
                                             type="submit"
                                             disabled={isLoading}
                                             className="w-full h-12  bg-teal-700 hover:bg-teal-800 text-white font-semibold text-base transition-all duration-300 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg lg:col-span-2"
                                        >
                                             {isLoading ? (
                                                  <div className="flex items-center gap-2 justify-center">
                                                       <Loader2 className="w-5 h-5 animate-spin" />
                                                       Đang đăng ký...
                                                  </div>
                                             ) : (
                                                  'Đăng ký với email'
                                             )}
                                        </Button>
                                   </FadeIn>
                              </form>

                              {/* Footer */}
                              <FadeIn delay={1300} duration={0.4}>
                                   <div className="mt-2">
                                        <p className="text-sm w-full text-gray-500 leading-relaxed">
                                             Bằng cách đăng ký, bạn đồng ý với{' '}
                                             <Link to="/terms-of-service" className="underline hover:text-gray-700 font-medium">Điều khoản dịch vụ</Link>
                                             {' '}và{' '}
                                             <Link to="/privacy-policy" className="underline hover:text-gray-700 font-medium">Chính sách bảo mật</Link>
                                             , bao gồm việc sử dụng cookie.
                                        </p>
                                        <div className="my-3 text-left">
                                             <p className="text-sm text-gray-700">
                                                  Đã có tài khoản?{' '}
                                                  <Button
                                                       onClick={onGoLogin}
                                                       className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-all duration-200 p-0 h-auto bg-transparent border-0 hover:bg-transparent text-base"
                                                  >
                                                       Đăng nhập ngay
                                                  </Button>
                                             </p>
                                        </div>
                                   </div>
                              </FadeIn>
                         </div>
                    </SlideIn>
               )}

               {step === 'otp' && (
                    <ScaleIn delay={0} duration={0.4}>
                         <Card className={`${compact ? "" : "shadow-lg border-0 bg-white/95 backdrop-blur-sm"} transition-all mt-10 rounded-2xl duration-300 hover:shadow-xl animate-scale-in`}>
                              <CardHeader className="text-center pb-4">
                                   <SlideIn direction="down" delay={100} duration={0.4}>
                                        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 transform transition-transform hover:scale-110">
                                             <CheckCircle className="w-6 h-6 text-white" />
                                        </div>
                                   </SlideIn>
                                   <FadeIn delay={200} duration={0.4}>
                                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                             Xác thực OTP
                                        </CardTitle>
                                   </FadeIn>
                                   <FadeIn delay={300} duration={0.4}>
                                        <CardDescription className="text-sm text-slate-600">
                                             Nhập mã OTP được gửi tới: <span className="font-medium text-slate-900">{email ? maskEmail(email) : 'email của bạn'}</span>
                                        </CardDescription>
                                   </FadeIn>
                              </CardHeader>

                              <CardContent className="space-y-4">
                                   <form onSubmit={handleVerifyOtp} className="space-y-4">
                                        <FadeIn delay={400} duration={0.4}>
                                             <div className="space-y-3">
                                                  <label className="text-xs font-medium text-slate-700 block text-center">Mã OTP (6 chữ số)</label>
                                                  <div className="flex justify-center">
                                                       <InputOTP
                                                            value={otp}
                                                            onChange={handleOtpChange}
                                                            maxLength={6}
                                                       >
                                                            <InputOTPGroup>
                                                                 <InputOTPSlot index={0} />
                                                                 <InputOTPSlot index={1} />
                                                                 <InputOTPSlot index={2} />
                                                            </InputOTPGroup>
                                                            <InputOTPSeparator />
                                                            <InputOTPGroup>
                                                                 <InputOTPSlot index={3} />
                                                                 <InputOTPSlot index={4} />
                                                                 <InputOTPSlot index={5} />
                                                            </InputOTPGroup>
                                                       </InputOTP>
                                                  </div>
                                             </div>
                                        </FadeIn>

                                        <FadeIn delay={500} duration={0.4}>
                                             <div className="space-y-3">
                                                  <Button
                                                       type="submit"
                                                       disabled={isLoading || otp.length !== 6}
                                                       className="w-full h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl hover:from-green-600 hover:to-green-700 text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                                  >
                                                       {isLoading ? (
                                                            <div className="flex items-center gap-2">
                                                                 <Loader2 className="w-4 h-4 animate-spin" />
                                                                 Đang xác thực...
                                                            </div>
                                                       ) : (
                                                            'Xác nhận OTP'
                                                       )}
                                                  </Button>

                                                  <div className="text-center space-y-2">
                                                       <p className="text-xs text-slate-600">Không nhận được mã?</p>
                                                       <Button
                                                            type="button"
                                                            onClick={handleResendOtp}
                                                            disabled={isLoading || countdown > 0}
                                                            className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-all duration-200 p-0 h-auto bg-transparent border-0 hover:bg-transparent text-sm disabled:opacity-50"
                                                       >
                                                            {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
                                                       </Button>
                                                  </div>

                                                  <Button
                                                       type="button"
                                                       onClick={() => setStep('form')}
                                                       variant="ghost"
                                                       className="w-fit text-xs text-slate-600 hover:text-slate-900 rounded-2xl hover:border-teal-300 border border-slate-300"
                                                  >
                                                       <ArrowLeft className="w-3 h-3 mr-1" />
                                                       Quay lại đăng ký
                                                  </Button>
                                             </div>
                                        </FadeIn>
                                   </form>
                              </CardContent>
                         </Card>
                    </ScaleIn>
               )}

               {step === 'success' && (
                    <ScaleIn delay={0} duration={0.5}>
                         <Card className={`${compact ? "" : "shadow-lg border-0 bg-white/95 backdrop-blur-sm"} transition-all mt-10 rounded-2xl duration-300 hover:shadow-xl animate-scale-in`}>
                              <CardHeader className="text-center pb-4">
                                   <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-3 transform transition-transform animate-scale-in otp-success-animation">
                                        <CheckCircle className="w-8 h-8 text-white" />
                                   </div>
                                   <FadeIn delay={200} duration={0.4}>
                                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                                             Thành công!
                                        </CardTitle>
                                   </FadeIn>
                                   <FadeIn delay={300} duration={0.4}>
                                        <CardDescription className="text-sm text-slate-600">
                                             Tài khoản đã được tạo thành công
                                        </CardDescription>
                                   </FadeIn>
                              </CardHeader>

                              <CardContent className="space-y-4">
                                   <FadeIn delay={400} duration={0.4}>
                                        <div className="text-center space-y-3">
                                             <p className="text-sm text-slate-600">Bạn có thể đăng nhập ngay để bắt đầu sử dụng BallSpot</p>
                                             <Button
                                                  onClick={() => (onDone ? onDone() : (onGoLogin && onGoLogin()))}
                                                  className="w-full h-10 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
                                             >
                                                  Đăng nhập ngay
                                             </Button>
                                        </div>
                                   </FadeIn>
                              </CardContent>
                         </Card>
                    </ScaleIn>
               )}
          </div>
     );
}