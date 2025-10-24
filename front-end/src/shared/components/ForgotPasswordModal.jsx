import { useState } from "react";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "../components/ui/index";
import { passwordResetService } from "../services/passwordResetService";
import ErrorDisplay from "./ErrorDisplay";

export default function ForgotPasswordModal({ onClose, onBackToLogin }) {
     const [step, setStep] = useState(1); // 1: Email, 2: OTP Verification
     const [email, setEmail] = useState("");
     const [otp, setOtp] = useState("");
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState("");
     const [info, setInfo] = useState("");
     const [emailError, setEmailError] = useState("");

     const validateEmail = (email) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
     };

     const handleSendOtp = async () => {
          if (!email) {
               setEmailError("Vui lòng nhập email");
               return;
          }

          if (!validateEmail(email)) {
               setEmailError("Email không hợp lệ");
               return;
          }

          setIsLoading(true);
          setError("");
          setInfo("");

          try {
               const result = await passwordResetService.sendResetOtp(email);

               if (!result.ok) {
                    setError(result.reason || "Gửi mã OTP thất bại");
                    setIsLoading(false);
                    return;
               }

               setInfo(result.message || "Mã OTP đã được gửi đến email của bạn");
               setStep(2);
          } catch (error) {
               setError(error.message || "Có lỗi xảy ra khi gửi mã OTP");
               console.error("Send OTP error:", error);
          } finally {
               setIsLoading(false);
          }
     };

     const handleVerifyOtp = async () => {
          if (!otp) {
               setError("Vui lòng nhập mã OTP");
               return;
          }

          if (otp.length !== 6) {
               setError("Mã OTP phải có 6 chữ số");
               return;
          }

          setIsLoading(true);
          setError("");
          setInfo("");

          try {
               const result = await passwordResetService.verifyResetOtp(otp);

               if (!result.ok) {
                    setError(result.reason || "Xác thực OTP thất bại");
                    setIsLoading(false);
                    return;
               }

               setInfo("Xác thực OTP thành công! Bạn có thể đặt lại mật khẩu.");
               // TODO: Navigate to reset password page or show reset password form
               setTimeout(() => {
                    onClose();
               }, 2000);
          } catch (error) {
               setError(error.message || "Có lỗi xảy ra khi xác thực OTP");
               console.error("Verify OTP error:", error);
          } finally {
               setIsLoading(false);
          }
     };

     const handleResendOtp = async () => {
          setIsLoading(true);
          setError("");
          setInfo("");

          try {
               const result = await passwordResetService.sendResetOtp(email);

               if (!result.ok) {
                    setError(result.reason || "Gửi lại mã OTP thất bại");
                    setIsLoading(false);
                    return;
               }

               setInfo("Mã OTP mới đã được gửi đến email của bạn");
          } catch (error) {
               setError(error.message || "Có lỗi xảy ra khi gửi lại mã OTP");
               console.error("Resend OTP error:", error);
          } finally {
               setIsLoading(false);
          }
     };

     return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
               <Card className="w-full max-w-md bg-white shadow-xl">
                    <CardHeader className="text-center pb-4">
                         <div className="mx-auto w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-2">
                              <Mail className="w-6 h-6 text-white" />
                         </div>
                         <CardTitle className="text-xl font-bold text-gray-900">
                              {step === 1 ? "Quên mật khẩu" : "Xác thực OTP"}
                         </CardTitle>
                         <p className="text-sm text-gray-600">
                              {step === 1
                                   ? "Nhập email để nhận mã OTP đặt lại mật khẩu"
                                   : "Nhập mã OTP đã được gửi đến email của bạn"
                              }
                         </p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                         {/* Error and Info Messages */}
                         {error && (
                              <ErrorDisplay
                                   type="error"
                                   title="Lỗi"
                                   message={error}
                                   onClose={() => setError("")}
                              />
                         )}
                         {info && (
                              <ErrorDisplay
                                   type="success"
                                   title="Thành công"
                                   message={info}
                                   onClose={() => setInfo("")}
                              />
                         )}

                         {step === 1 ? (
                              // Step 1: Email Input
                              <div className="space-y-4">
                                   <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                             Email đăng ký
                                        </label>
                                        <div className="relative">
                                             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                             <Input
                                                  value={email}
                                                  onChange={(e) => {
                                                       setEmail(e.target.value);
                                                       setEmailError("");
                                                  }}
                                                  onBlur={() => {
                                                       if (email && !validateEmail(email)) {
                                                            setEmailError("Email không hợp lệ");
                                                       }
                                                  }}
                                                  type="email"
                                                  className={`pl-9 ${emailError ? "border-red-500 focus:ring-red-500" : "focus:ring-orange-500 focus:border-orange-500"}`}
                                                  placeholder="example@email.com"
                                             />
                                        </div>
                                        {emailError && (
                                             <p className="text-xs text-red-600 flex items-center gap-1">
                                                  <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                                                  {emailError}
                                             </p>
                                        )}
                                   </div>

                                   <div className="flex gap-2">
                                        <Button
                                             type="button"
                                             onClick={onBackToLogin}
                                             variant="outline"
                                             className="flex-1"
                                        >
                                             <ArrowLeft className="w-4 h-4 mr-2" />
                                             Quay lại
                                        </Button>
                                        <Button
                                             onClick={handleSendOtp}
                                             disabled={isLoading || !email}
                                             className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                                        >
                                             {isLoading ? (
                                                  <>
                                                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                       Đang gửi...
                                                  </>
                                             ) : (
                                                  "Gửi mã OTP"
                                             )}
                                        </Button>
                                   </div>
                              </div>
                         ) : (
                              // Step 2: OTP Verification
                              <div className="space-y-4">
                                   <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                             Mã OTP (6 chữ số)
                                        </label>
                                        <Input
                                             value={otp}
                                             onChange={(e) => {
                                                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                  setOtp(value);
                                                  setError("");
                                             }}
                                             type="text"
                                             className="text-center text-lg tracking-widest focus:ring-orange-500 focus:border-orange-500"
                                             placeholder="000000"
                                             maxLength={6}
                                        />
                                        <p className="text-xs text-gray-500 text-center">
                                             Mã OTP đã được gửi đến: <span className="font-medium">{email}</span>
                                        </p>
                                   </div>

                                   <div className="flex gap-2">
                                        <Button
                                             type="button"
                                             onClick={() => setStep(1)}
                                             variant="outline"
                                             className="flex-1"
                                        >
                                             <ArrowLeft className="w-4 h-4 mr-2" />
                                             Quay lại
                                        </Button>
                                        <Button
                                             onClick={handleVerifyOtp}
                                             disabled={isLoading || otp.length !== 6}
                                             className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                                        >
                                             {isLoading ? (
                                                  <>
                                                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                       Đang xác thực...
                                                  </>
                                             ) : (
                                                  "Xác thực OTP"
                                             )}
                                        </Button>
                                   </div>

                                   <div className="text-center">
                                        <Button
                                             type="button"
                                             onClick={handleResendOtp}
                                             disabled={isLoading}
                                             variant="ghost"
                                             className="text-sm text-orange-600 hover:text-orange-700"
                                        >
                                             {isLoading ? (
                                                  <>
                                                       <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                       Đang gửi lại...
                                                  </>
                                             ) : (
                                                  "Gửi lại mã OTP"
                                             )}
                                        </Button>
                                   </div>
                              </div>
                         )}
                    </CardContent>
               </Card>
          </div>
     );
}
