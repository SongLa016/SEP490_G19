import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '../services/authService';
import { Button, Input } from '../components/ui';
import { FadeIn, SlideIn } from '../components/ui/animations';
import { Eye, EyeOff, Phone, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import Swal from 'sweetalert2';

export default function Login({ onLoggedIn, onGoRegister, compact = false }) {
     const location = useLocation();
     const { login } = useAuth();
     const [phone, setPhone] = useState('');
     const [password, setPassword] = useState('');
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

                    Swal.fire({
                         icon: 'error',
                         title: 'Đăng nhập thất bại',
                         text: errorMessage,
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#ef4444'
                    });
                    setIsLoading(false);
                    return;
               }

               // Store user data and token - only if we have valid user data
               if (!result.user || !result.token) {
                    Swal.fire({
                         icon: 'error',
                         title: 'Đăng nhập thất bại',
                         text: 'Không nhận được thông tin người dùng từ máy chủ. Vui lòng thử lại.',
                         confirmButtonText: 'Đóng',
                         confirmButtonColor: '#ef4444'
                    });
                    setIsLoading(false);
                    return;
               }

               localStorage.setItem('user', JSON.stringify(result.user));
               login(result.user, result.token);

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
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi đăng nhập',
                    text: errorMessage,
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#ef4444'
               });
               console.error('Login error:', error);
               setIsLoading(false);
          }
     }

     const googleLogin = useGoogleLogin({
          onSuccess: async (tokenResponse) => {
               if (isGoogleLoading || isLoading) return;
               setIsGoogleLoading(true);

               try {
                    // Get user info from Google using access token
                    const userInfoResponse = await fetch(
                         'https://www.googleapis.com/oauth2/v3/userinfo',
                         {
                              headers: {
                                   Authorization: `Bearer ${tokenResponse.access_token}`,
                                   'Accept': 'application/json; charset=utf-8',
                              },
                         }
                    );

                    if (!userInfoResponse.ok) {
                         throw new Error("Không thể lấy thông tin từ Google");
                    }

                    // Ensure UTF-8 encoding when parsing JSON
                    const userInfo = await userInfoResponse.json();
                    const email = userInfo.email;
                    // Get name from Google API (already UTF-8 encoded)
                    const name = userInfo.name || `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim();

                    if (!email) throw new Error("Google không trả email về!");

                    // Call API login
                    const result = await authService.loginWithGoogle(email, name);
                    if (!result.ok) throw new Error(result.reason);

                    localStorage.setItem("user", JSON.stringify(result.user));
                    login(result.user, result.token);

                    Swal.fire({
                         icon: "success",
                         title: "Đăng nhập thành công",
                         text: `Xin chào ${result?.user?.fullName || name}`,
                         timer: 2000,
                         showConfirmButton: false,
                    });

                    onLoggedIn?.(result.user);
               } catch (err) {
                    console.error("Google Login Error:", err);
                    Swal.fire({
                         icon: "error",
                         title: "Google Login thất bại",
                         text: err.message || "Có lỗi xảy ra khi đăng nhập với Google",
                    });
               }

               setIsGoogleLoading(false);
          },
          onError: (error) => {
               console.error("Google Login Error:", error);
               Swal.fire({
                    icon: "error",
                    title: "Google Login thất bại",
                    text: error.error_description || "Không thể đăng nhập với Google",
               });
               setIsGoogleLoading(false);
          },
     });

     function handleGoogleLogin() {
          if (isGoogleLoading || isLoading) return;
          googleLogin();
     }


     return (
          <div className={compact ? "w-full" : "max-w-sm mx-auto p-3"}>
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
                                        Trải nghiệm vẻ đẹp của những sân bóng tuyệt vời và tìm kiếm những trận đấu hoàn hảo cùng BallSpot.
                                   </p>
                              </FadeIn>
                         </div>

                         {/* Social Login Buttons */}
                         <div className="">
                              <FadeIn delay={300} duration={0.4}>
                                   <Button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        disabled={isGoogleLoading || isLoading}
                                        className="w-full h-12 bg-white rounded-3xl border-2 border-gray-200 hover:text-teal-700 hover:border-gray-300 hover:bg-gray-50 text-gray-900 font-medium text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-sm"
                                   >
                                        {isGoogleLoading ? (
                                             <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                             <>
                                                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                                                       <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                       <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                       <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                       <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                  </svg>
                                                  <span className="font-medium">Tiếp tục với Google</span>
                                             </>
                                        )}
                                   </Button>
                              </FadeIn>
                         </div>

                         {/* Divider */}
                         <FadeIn delay={450} duration={0.4}>
                              <div className="relative my-2">
                                   <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-teal-400"></div>
                                   </div>
                                   <div className="relative flex justify-center">
                                        <span className="px-4 bg-white rounded-3xl text-teal-700 text-xs">HOẶC</span>
                                   </div>
                              </div>
                         </FadeIn>

                         {/* Form */}
                         <form onSubmit={handleSubmit} className="space-y-2">
                              <FadeIn delay={500} duration={0.4}>
                                   <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                                        <div className="relative">
                                             <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors" />
                                             <Input
                                                  value={phone}
                                                  onChange={(e) => setPhone(e.target.value)}
                                                  onBlur={() => setPhoneError(!phone || !/^[0-9]{10,11}$/.test(phone.replace(/\s/g, '')) ? 'Số điện thoại không hợp lệ' : '')}
                                                  required
                                                  type="tel"
                                                  className={`pl-12 h-12 text-sm transition-all duration-200 rounded-2xl ${phoneError ? 'border-red-500 focus:ring-red-500 animate-shake' : 'focus:ring-teal-500 focus:border-teal-500 border-gray-200'}`}
                                                  placeholder="Nhập số điện thoại"
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

                              <FadeIn delay={600} duration={0.4}>
                                   <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
                                        <div className="relative">
                                             <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors" />
                                             <Input
                                                  value={password}
                                                  onChange={(e) => setPassword(e.target.value)}
                                                  onBlur={() => setPasswordError(!password || password.length < 6 ? 'Mật khẩu tối thiểu 6 ký tự' : '')}
                                                  required
                                                  type={showPassword ? "text" : "password"}
                                                  className={`pl-12 pr-12 h-12  text-sm transition-all duration-200 rounded-2xl ${passwordError ? 'border-red-500 focus:ring-red-500 animate-shake' : 'focus:ring-teal-500 focus:border-teal-500 border-gray-200'}`}
                                                  placeholder="Nhập mật khẩu"
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

                              <FadeIn delay={700} duration={0.4}>
                                   <div className="flex items-center justify-between text-xs">
                                        <label className="flex items-center gap-2 text-gray-600 cursor-pointer group">
                                             <input
                                                  type="checkbox"
                                                  checked={rememberMe}
                                                  onChange={(e) => setRememberMe(e.target.checked)}
                                                  className="rounded-full border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4 transition-all duration-200 group-hover:scale-110 checked:bg-teal-600 checked:border-teal-600"
                                             />
                                             <span className="transition-colors duration-200">Ghi nhớ đăng nhập</span>
                                        </label>
                                        <Button
                                             type="button"
                                             onClick={() => setShowForgotPasswordModal(true)}
                                             className="text-teal-600 hover:text-teal-700 hover:underline p-0 h-auto bg-transparent border-0 hover:bg-transparent transition-all duration-200 text-sm"
                                        >
                                             Quên mật khẩu?
                                        </Button>
                                   </div>
                              </FadeIn>

                              <FadeIn delay={800} duration={0.4}>
                                   <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 mt-3 rounded-3xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                   >
                                        {isLoading ? (
                                             <div className="flex items-center gap-2 justify-center">
                                                  <Loader2 className="w-5 h-5 animate-spin" />
                                                  Đang đăng nhập...
                                             </div>
                                        ) : (
                                             'Đăng nhập'
                                        )}
                                   </Button>
                              </FadeIn>
                         </form>

                         {/* Footer */}
                         <FadeIn delay={900} duration={0.4}>
                              <div className="mt-2">
                                   <p className="text-sm text-gray-500 leading-relaxed">
                                        Bằng cách đăng nhập, bạn đồng ý với{' '}
                                        <Link to="/terms-of-service" className="underline hover:text-gray-700 font-medium">Điều khoản dịch vụ</Link>
                                        {' '}và{' '}
                                        <Link to="/privacy-policy" className="underline hover:text-gray-700 font-medium">Chính sách bảo mật</Link>
                                        , bao gồm việc sử dụng cookie.
                                   </p>
                                   <div className="my-3 text-left">
                                        <p className="text-sm text-gray-700">
                                             Chưa có tài khoản?{' '}
                                             <Button
                                                  onClick={onGoRegister}
                                                  className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-all duration-200 p-0 h-auto bg-transparent border-0 hover:bg-transparent text-base"
                                             >
                                                  Đăng ký ngay
                                             </Button>
                                        </p>
                                   </div>
                              </div>
                         </FadeIn>
                    </div>
               </SlideIn>

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

