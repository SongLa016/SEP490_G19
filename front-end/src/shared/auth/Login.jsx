import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui';
import { Eye, EyeOff, Phone, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ErrorDisplay from '../components/ErrorDisplay';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import Swal from 'sweetalert2';

export default function Login({ onLoggedIn, onGoRegister, compact = false }) {
     const location = useLocation();
     const { login } = useAuth();
     const [phone, setPhone] = useState('');
     const [password, setPassword] = useState('');
     const [error, setError] = useState('');
     const [phoneError, setPhoneError] = useState('');
     const [passwordError, setPasswordError] = useState('');
     const [showPassword, setShowPassword] = useState(false);
     const [isLoading, setIsLoading] = useState(false);
     const [isGoogleLoading, setIsGoogleLoading] = useState(false);
     const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
     const [rememberMe, setRememberMe] = useState(false);

     useEffect(() => {
          if (location.state?.msg) {
               Swal.fire({
                    title: 'Thông báo',
                    text: location.state.msg,
                    icon: 'info',
                    confirmButtonText: 'Đã hiểu',
                    timer: 5000,
                    timerProgressBar: true,
                    toast: true,
                    position: 'top-end'
               });
               // Clear state to prevent showing again on refresh
               window.history.replaceState({}, document.title);
          }
     }, [location.state]);

     // Load saved login data on component mount
     useEffect(() => {
          const savedPhone = localStorage.getItem('rememberedPhone');
          const savedRememberMe = localStorage.getItem('rememberMe') === 'true';

          if (savedPhone && savedRememberMe) {
               setPhone(savedPhone);
               setRememberMe(true);
          }
     }, []);

     async function handleSubmit(e) {
          e.preventDefault();
          setError('');
          setIsLoading(true);

          // Validation
          const phoneOk = phone && /^[0-9]{10,11}$/.test(phone.replace(/\s/g, ''));
          const passOk = String(password).length >= 6;
          setPhoneError(phoneOk ? '' : 'Số điện thoại không hợp lệ');
          setPasswordError(passOk ? '' : 'Mật khẩu tối thiểu 6 ký tự');

          if (!phoneOk || !passOk) {
               setIsLoading(false);
               return;
          }

          try {
               const result = await authService.loginUser({ phone, password });
               if (!result.ok) {
                    // Hiển thị lỗi chi tiết từ API
                    let errorMessage = result.reason || 'Đăng nhập thất bại';

                    // Xử lý các loại lỗi phổ biến
                    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
                         errorMessage = 'Số điện thoại hoặc mật khẩu không đúng';
                    } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
                         errorMessage = 'Không tìm thấy tài khoản với số điện thoại này';
                    } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
                         errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau';
                    } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
                         errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet';
                    }

                    setError(errorMessage);
                    setIsLoading(false);
                    return;
               }

               // Store user data and token
               if (result.user) {
                    localStorage.setItem('user', JSON.stringify(result.user));
                    login(result.user, result.token);
               }

               // Handle remember me functionality
               if (rememberMe) {
                    localStorage.setItem('rememberedPhone', phone);
                    localStorage.setItem('rememberMe', 'true');
               } else {
                    localStorage.removeItem('rememberedPhone');
                    localStorage.removeItem('rememberMe');
               }

               setIsLoading(false);
               onLoggedIn && onLoggedIn(result.user);
          } catch (error) {
               // Hiển thị lỗi chi tiết từ exception
               const errorMessage = error.message || 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.';
               setError(errorMessage);
               console.error('Login error:', error);
               setIsLoading(false);
          }
     }

     async function handleGoogleLogin() {
          setIsGoogleLoading(true);
          setError('');

          try {
               // TODO: Integrate with real Google OAuth
               // For now, show error message
               setError("Chức năng đăng nhập Google chưa được tích hợp. Vui lòng sử dụng đăng nhập thường.");
               setIsGoogleLoading(false);
               return;
          } catch (error) {
               // Hiển thị lỗi chi tiết từ exception
               const errorMessage = error.message || 'Có lỗi xảy ra khi đăng nhập Google. Vui lòng thử lại.';
               setError(errorMessage);
               console.error('Google login error:', error);
               setIsGoogleLoading(false);
          }
     }

     return (
          <div className={compact ? "" : "max-w-sm mx-auto p-4"}>
               {error && (
                    <ErrorDisplay
                         type="error"
                         title="Lỗi đăng nhập"
                         message={error}
                         onClose={() => setError('')}
                    />
               )}

               <Card className={`${compact ? "" : "shadow-lg border-0 bg-white/95 backdrop-blur-sm"} transition-all duration-300 hover:shadow-xl bg-transparent`}>
                    <CardHeader className="text-center pb-2">
                         <div className="mx-auto w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-1">
                              <Lock className="w-6 h-6 text-white" />
                         </div>
                         <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-teal-500">
                              Đăng nhập
                         </CardTitle>
                         <CardDescription className="text-sm text-teal-300">
                              Chào mừng trở lại BallSpot
                         </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                         <form onSubmit={handleSubmit} className="space-y-4">
                              <div className="space-y-1">
                                   <label className="text-xs font-medium text-teal-500">Số điện thoại</label>
                                   <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                             value={phone}
                                             onChange={(e) => setPhone(e.target.value)}
                                             onBlur={() => setPhoneError(!phone || !/^[0-9]{10,11}$/.test(phone.replace(/\s/g, '')) ? 'Số điện thoại không hợp lệ' : '')}
                                             required
                                             type="tel"
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
                                   <label className="text-xs font-medium text-teal-500">Mật khẩu</label>
                                   <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                             value={password}
                                             onChange={(e) => setPassword(e.target.value)}
                                             onBlur={() => setPasswordError(!password || password.length < 6 ? 'Mật khẩu tối thiểu 6 ký tự' : '')}
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

                              <div className="flex items-center justify-between text-xs">
                                   <label className="flex items-center gap-1.5 text-teal-500 cursor-pointer">
                                        <input
                                             type="checkbox"
                                             checked={rememberMe}
                                             onChange={(e) => setRememberMe(e.target.checked)}
                                             className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3 h-3"
                                        />
                                        Ghi nhớ
                                   </label>
                                   <Button
                                        type="button"
                                        onClick={() => setShowForgotPasswordModal(true)}
                                        className="text-teal-600 hover:text-teal-500 hover:underline p-0 h-auto bg-transparent border-0 hover:bg-transparent"
                                   >
                                        Quên mật khẩu?
                                   </Button>
                              </div>

                              <Button
                                   type="submit"
                                   disabled={isLoading}
                                   className="w-full h-10 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                   {isLoading ? (
                                        <div className="flex items-center gap-2">
                                             <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                             Đang đăng nhập...
                                        </div>
                                   ) : (
                                        'Đăng nhập'
                                   )}
                              </Button>
                         </form>

                         {/* Divider */}
                         <div className="relative my-4">
                              <div className="absolute inset-0 flex items-center">
                                   <div className="w-full border-t border-gray-300"></div>
                              </div>
                              <div className="relative flex  justify-center text-xs">
                                   <span className="px-2 bg-white rounded-full text-gray-500">Hoặc</span>
                              </div>
                         </div>

                         {/* Google Login Button */}
                         <Button
                              type="button"
                              onClick={handleGoogleLogin}
                              disabled={isGoogleLoading || isLoading}
                              className="w-full h-10 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                              {isGoogleLoading ? (
                                   <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                        Đang đăng nhập...
                                   </div>
                              ) : (
                                   <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                                             <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                             <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                             <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                             <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Đăng nhập với Google
                                   </div>
                              )}
                         </Button>

                         <div className="text-center">
                              <p className="text-xs text-slate-400">
                                   Chưa có tài khoản?{' '}
                                   <Button
                                        onClick={onGoRegister}
                                        className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-colors p-0 h-auto bg-transparent border-0 hover:bg-transparent"
                                   >
                                        Đăng ký ngay
                                   </Button>
                              </p>
                         </div>
                    </CardContent>
               </Card>

               {/* Forgot Password Modal */}
               {showForgotPasswordModal && (
                    <ForgotPasswordModal
                         onClose={() => setShowForgotPasswordModal(false)}
                         onBackToLogin={() => setShowForgotPasswordModal(false)}
                    />
               )}
          </div>
     );
}


