import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { loginWithPassword, mockGoogleLogin, getCurrentUser, createDemoUsers } from '../../utils/authStore';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Login({ onLoggedIn, onGoRegister, compact = false }) {
     const location = useLocation();
     const [username, setUsername] = useState('');
     const [password, setPassword] = useState('');
     const [error, setError] = useState('');
     const [usernameError, setUsernameError] = useState('');
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

          // basic validation
          const usernameOk = username.trim().length >= 3 && !/\s/.test(username);
          const passOk = String(password).length >= 6;
          setUsernameError(usernameOk ? '' : 'Tên đăng nhập tối thiểu 3 ký tự và không được có khoảng trắng');
          setPasswordError(passOk ? '' : 'Mật khẩu tối thiểu 6 ký tự');

          if (!usernameOk || !passOk) {
               setIsLoading(false);
               return;
          }

          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          const res = loginWithPassword({ username, password });
          if (!res.ok) {
               setError(res.reason || 'Đăng nhập thất bại');
               setIsLoading(false);
               return;
          }
          setIsLoading(false);
          onLoggedIn && onLoggedIn(getCurrentUser());
     }
     function handleGoogle() {
          setError('');
          const res = mockGoogleLogin({ email: `user${Date.now()}@gmail.com`, name: username || 'User' });
          if (!res.ok) {
               setError('Google login thất bại');
               return;
          }
          onLoggedIn && onLoggedIn(getCurrentUser());
     }

     function handleDemoLogin(demoUsername) {
          setError('');
          setUsername(demoUsername);
          setPassword('123456');

          // Auto login after a short delay
          setTimeout(() => {
               const res = loginWithPassword({ username: demoUsername, password: '123456' });
               if (res.ok) {
                    onLoggedIn && onLoggedIn(getCurrentUser());
               } else {
                    setError('Demo login thất bại');
               }
          }, 500);
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
                                   <label className="text-xs font-medium text-teal-500">Tên đăng nhập</label>
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
                                             type="text"
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
                                   <label className="text-xs font-medium text-teal-500">Mật khẩu</label>
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

                         <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                   <div className="w-full border-t border-slate-200" />
                              </div>
                              <div className="relative flex  justify-center text-xs uppercase">
                                   <span className="bg-white px-2 rounded-md text-slate-500">Hoặc</span>
                              </div>
                         </div>

                         <Button
                              onClick={handleGoogle}
                              variant="outline"
                              className="w-full h-10 border-slate-200 hover:bg-slate-50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-sm"
                         >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 mr-2">
                                   <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 31.9 29.3 35 24 35c-7 0-12.8-5.8-12.8-12.8S17 9.5 24 9.5c3.1 0 6 1.1 8.2 3.1l5.7-5.7C34.4 3.8 29.5 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.2-.1-2.4-.4-3.5z" />
                                   <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.8 18.9 13 24 13c3.1 0 6 1.1 8.2 3.1l5.7-5.7C34.4 3.8 29.5 2 24 2 15 2 7.4 7.3 6.3 14.7z" />
                                   <path fill="#4CAF50" d="M24 46c5.2 0 10-1.8 13.7-4.9l-6.3-5.2C29.3 37.8 26.8 38.5 24 38.5c-5.2 0-9.6-3.3-11.3-7.8l-6.6 5.1C7.4 40.7 15 46 24 46z" />
                                   <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.2-4.6 5.5-8.3 5.5-5.2 0-9.6-3.3-11.3-7.8l-6.6 5.1C7.4 40.7 15 46 24 46c11 0 21-8 21-22 0-1.2-.1-2.4-.4-3.5z" />
                              </svg>
                              Google
                         </Button>

                         {/* Demo Users Section */}
                         <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-600 mb-2 text-center">🎯 Demo Users (cho testing)</p>
                              <div className="grid grid-cols-1 gap-1">
                                   <Button
                                        onClick={() => {
                                             createDemoUsers();
                                             handleDemoLogin('demo');
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs h-7"
                                   >
                                        👤 User Demo (demo/123456)
                                   </Button>
                                   <Button
                                        onClick={() => {
                                             createDemoUsers();
                                             handleDemoLogin('owner');
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs h-7"
                                   >
                                        🏟️ Owner Demo (owner/123456)
                                   </Button>
                                   <Button
                                        onClick={() => {
                                             createDemoUsers();
                                             handleDemoLogin('admin');
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs h-7"
                                   >
                                        👑 Admin Demo (admin/123456)
                                   </Button>
                              </div>
                         </div>

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


