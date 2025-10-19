import { useState } from 'react';
import {
     registerUser,
     completeRegistrationWithOtp,
} from '../../utils/authStore';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui';
import { Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle, Upload, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Register({ onDone, onGoLogin, compact = false }) {
     const { login } = useAuth();
     const [step, setStep] = useState('form'); // form | otp | success
     const [username, setUsername] = useState('');
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [role, setRole] = useState('User');
     const [name, setName] = useState('');
     const [phone, setPhone] = useState('');
     const [otp, setOtp] = useState('');
     const [error, setError] = useState('');
     const [usernameError, setUsernameError] = useState('');
     const [emailError, setEmailError] = useState('');
     const [passwordError, setPasswordError] = useState('');
     const [phoneError, setPhoneError] = useState('');
     const [info, setInfo] = useState('');
     const [showPassword, setShowPassword] = useState(false);
     const [isLoading, setIsLoading] = useState(false);

     // Owner docs
     const [pitchImages, setPitchImages] = useState([]);
     const [businessLicense, setBusinessLicense] = useState(null);
     const [identityCard, setIdentityCard] = useState(null);
     const [pitchError, setPitchError] = useState('');
     const [blError, setBlError] = useState('');
     const [idError, setIdError] = useState('');
     const [dragPitch, setDragPitch] = useState(false);
     const [dragBL, setDragBL] = useState(false);
     const [dragID, setDragID] = useState(false);
     const MAX_PITCH_IMAGES = 6;

     async function handleSubmit(e) {
          e.preventDefault();
          setError('');
          setIsLoading(true);

          const usernameOk = username.trim().length >= 3 && !/\s/.test(username);
          const emailOk = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          const passOk = String(password).length >= 6;
          const phoneOk = !phone || /^\+?\d{9,15}$/.test(phone);
          setUsernameError(usernameOk ? '' : 'Tên đăng nhập tối thiểu 3 ký tự và không được có khoảng trắng');
          setEmailError(emailOk ? '' : 'Email không hợp lệ');
          setPasswordError(passOk ? '' : 'Mật khẩu tối thiểu 6 ký tự');
          setPhoneError(phoneOk ? '' : 'Số điện thoại không hợp lệ');

          if (!usernameOk || !emailOk || !passOk || !phoneOk) {
               setIsLoading(false);
               return;
          }
          setInfo('');

          let ownerDocs = null;
          if (role === 'FieldOwner') {
               if (pitchImages.length === 0 || !businessLicense || !identityCard) {
                    setError('Vui lòng tải đủ tài liệu yêu cầu cho Chủ sân');
                    setIsLoading(false);
                    return;
               }
               ownerDocs = {
                    pitchImages,
                    businessLicense,
                    identityCard
               };
          }

          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1500));

          const res = registerUser({
               username,
               email: email || null,
               password,
               name,
               phone,
               role,
               ownerDocs
          });

          if (!res.ok) {
               setError(res.reason || 'Đăng ký thất bại');
               setIsLoading(false);
               return;
          }

          if (res.requiresEmailVerification) {
               setStep('otp');
          } else {
               login(res.user); // Login user after successful registration
               setStep('success');
          }
          setIsLoading(false);
     }

     async function handleVerifyOtp(e) {
          e.preventDefault();
          setError('');
          setIsLoading(true);

          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          const res = completeRegistrationWithOtp({ email, otp });
          if (!res.ok) {
               setError(res.reason || 'Xác thực OTP thất bại');
               setIsLoading(false);
               return;
          }

          login(res.user); // Login user after successful OTP verification
          setStep('success');
          setIsLoading(false);
     }

     function maskEmail(email) {
          const [local, domain] = email.split('@');
          return `${local.slice(0, 2)}***@${domain}`;
     }

     return (
          <div className={compact ? "" : "max-w-sm mx-auto p-4"}>
               {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm animate-in slide-in-from-top-2 duration-300">
                         <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              {error}
                         </div>
                    </div>
               )}

               {info && (
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2 text-sm animate-in slide-in-from-top-2 duration-300">
                         <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              {info}
                         </div>
                    </div>
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
                                        <label className="text-xs font-medium text-slate-700">Tên đăng nhập *</label>
                                        <div className="relative">
                                             <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                             <Input
                                                  value={username}
                                                  onChange={(e) => {
                                                       const value = e.target.value.replace(/\s/g, ''); // Remove spaces
                                                       setUsername(value);
                                                  }}
                                                  onBlur={() => setUsernameError(username.trim().length >= 3 && !/\s/.test(username) ? '' : 'Tên đăng nhập tối thiểu 3 ký tự và không được có khoảng trắng')}
                                                  required
                                                  className={`pl-9 h-10 text-sm ${usernameError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                                  placeholder="Tên đăng nhập (không có khoảng trắng)"
                                             />
                                        </div>
                                        {usernameError && <p className="text-xs text-red-600 flex items-center gap-1">
                                             <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                             {usernameError}
                                        </p>}
                                   </div>

                                   <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Họ và tên (tùy chọn)</label>
                                        <div className="relative">
                                             <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                             <Input
                                                  value={name}
                                                  onChange={(e) => setName(e.target.value)}
                                                  className="pl-9 h-10 text-sm focus:ring-teal-500 focus:border-teal-500"
                                                  placeholder="Nhập họ và tên (có thể thêm sau)"
                                             />
                                        </div>
                                        <p className="text-xs text-gray-500">Có thể cập nhật thông tin này sau trong phần profile</p>
                                   </div>

                                   <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Email (tùy chọn)</label>
                                        <div className="relative">
                                             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                             <Input
                                                  value={email}
                                                  onChange={(e) => setEmail(e.target.value)}
                                                  onBlur={() => setEmailError(!email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Email không hợp lệ')}
                                                  type="email"
                                                  className={`pl-9 h-10 text-sm ${emailError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                                  placeholder="you@example.com (tùy chọn)"
                                             />
                                        </div>
                                        {emailError && <p className="text-xs text-red-600 flex items-center gap-1">
                                             <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                             {emailError}
                                        </p>}
                                        <p className="text-xs text-gray-500">Email sẽ được yêu cầu khi đặt sân hoặc thao tác quan trọng</p>
                                   </div>

                                   <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Số điện thoại</label>
                                        <div className="relative">
                                             <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                             <Input
                                                  value={phone}
                                                  onChange={(e) => setPhone(e.target.value)}
                                                  onBlur={() => setPhoneError(!phone || /^\+?\d{9,15}$/.test(phone) ? '' : 'Số điện thoại không hợp lệ')}
                                                  className={`pl-9 h-10 text-sm ${phoneError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                                  placeholder="0123456789"
                                             />
                                        </div>
                                        {phoneError && <p className="text-xs text-red-600 flex items-center gap-1">
                                             <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                             {phoneError}
                                        </p>}
                                   </div>

                                   <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Mật khẩu</label>
                                        <div className="relative">
                                             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                             <Input
                                                  value={password}
                                                  onChange={(e) => setPassword(e.target.value)}
                                                  onBlur={() => setPasswordError(String(password).length >= 6 ? '' : 'Mật khẩu tối thiểu 6 ký tự')}
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
                                             <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                             {passwordError}
                                        </p>}
                                   </div>

                                   <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Loại tài khoản</label>
                                        <Select value={role} onValueChange={setRole}>
                                             <SelectTrigger className="h-10 text-sm focus:ring-teal-500 focus:border-teal-500">
                                                  <SelectValue placeholder="Chọn loại tài khoản" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  <SelectItem value="User">Người dùng</SelectItem>
                                                  <SelectItem value="FieldOwner">Chủ sân</SelectItem>
                                             </SelectContent>
                                        </Select>
                                   </div>

                                   {role === 'FieldOwner' && (
                                        <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                             <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                                                  <Upload className="w-3 h-3" />
                                                  Tài liệu yêu cầu
                                             </h4>
                                             <div className="space-y-2">
                                                  <div className="space-y-1">
                                                       <label className="text-xs font-medium text-slate-600">Ảnh sân bóng (tối đa 6 ảnh)</label>
                                                       <div className="grid grid-cols-3 gap-1.5">
                                                            {Array.from({ length: MAX_PITCH_IMAGES }).map((_, i) => (
                                                                 <div key={i} className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                                                                      {pitchImages[i] ? (
                                                                           <div className="relative w-full h-full">
                                                                                <img src={pitchImages[i]} alt={`Pitch ${i + 1}`} className="w-full h-full object-cover rounded-lg" />
                                                                                <Button
                                                                                     type="button"
                                                                                     onClick={() => {
                                                                                          const newImages = [...pitchImages];
                                                                                          newImages.splice(i, 1);
                                                                                          setPitchImages(newImages);
                                                                                     }}
                                                                                     className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors p-0"
                                                                                >
                                                                                     <X className="w-2 h-2" />
                                                                                </Button>
                                                                           </div>
                                                                      ) : (
                                                                           <label className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
                                                                                <Upload className="w-4 h-4" />
                                                                                <input
                                                                                     type="file"
                                                                                     accept="image/*"
                                                                                     onChange={(e) => {
                                                                                          const file = e.target.files[0];
                                                                                          if (file) {
                                                                                               const reader = new FileReader();
                                                                                               reader.onload = (e) => {
                                                                                                    const newImages = [...pitchImages];
                                                                                                    newImages[i] = e.target.result;
                                                                                                    setPitchImages(newImages);
                                                                                               };
                                                                                               reader.readAsDataURL(file);
                                                                                          }
                                                                                     }}
                                                                                     className="hidden"
                                                                                />
                                                                           </label>
                                                                      )}
                                                                 </div>
                                                            ))}
                                                       </div>
                                                       {pitchError && <p className="text-xs text-red-600">{pitchError}</p>}
                                                  </div>
                                             </div>
                                        </div>
                                   )}

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