import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui';
import { Eye, EyeOff, Phone, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ErrorDisplay from '../../components/ErrorDisplay';
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
                                   <label className="flex items-center gap-1.5 text-teal-500">
                                        <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3 h-3" />
                                        Ghi nhớ
                                   </label>
                                   <Button type="button" className="text-teal-600 hover:text-teal-700 hover:underline p-0 h-auto bg-transparent border-0 hover:bg-transparent">
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
          </div>
     );
}


