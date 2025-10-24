import { useState } from "react";
import { X, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { Button, Input } from "./ui";
import { createOtpForEmail, verifyOtpForEmail, updateUserProfile } from "../utils/authStore";

export default function EmailVerificationModal({
     isOpen,
     onClose,
     user,
     onSuccess,
     title = "Xác thực Email"
}) {
     const [email, setEmail] = useState(user?.email || "");
     const [otp, setOtp] = useState("");
     const [step, setStep] = useState("email"); // "email" | "otp" | "success"
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState("");
     const [emailError, setEmailError] = useState("");

     const handleEmailSubmit = async (e) => {
          e.preventDefault();
          setError("");
          setEmailError("");

          if (!email.trim()) {
               setEmailError("Vui lòng nhập email");
               return;
          }

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
               setEmailError("Email không hợp lệ");
               return;
          }

          setIsLoading(true);
          try {
               // Create OTP for email
               createOtpForEmail(email);
               setStep("otp");
          } catch (error) {
               setError("Có lỗi xảy ra khi gửi OTP. Vui lòng thử lại.");
          } finally {
               setIsLoading(false);
          }
     };

     const handleOtpSubmit = async (e) => {
          e.preventDefault();
          setError("");

          if (!otp.trim()) {
               setError("Vui lòng nhập mã OTP");
               return;
          }

          setIsLoading(true);
          try {
               const verifyResult = verifyOtpForEmail(email, otp);
               if (!verifyResult.ok) {
                    setError(verifyResult.reason);
                    setIsLoading(false);
                    return;
               }

               // Update user profile with verified email
               const updateResult = updateUserProfile({
                    userId: user.id,
                    email: email,
                    emailVerified: true
               });

               if (updateResult.ok) {
                    setStep("success");
                    onSuccess?.(updateResult.user);
               } else {
                    setError("Có lỗi xảy ra khi cập nhật thông tin.");
               }
          } catch (error) {
               setError("Có lỗi xảy ra khi xác thực OTP. Vui lòng thử lại.");
          } finally {
               setIsLoading(false);
          }
     };

     const handleClose = () => {
          setStep("email");
          setEmail("");
          setOtp("");
          setError("");
          setEmailError("");
          onClose();
     };

     if (!isOpen) return null;

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
               <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                         <h2 className="text-xl font-bold text-teal-800">{title}</h2>
                         <Button
                              onClick={handleClose}
                              variant="ghost"
                              className="p-2 h-auto"
                         >
                              <X className="w-5 h-5" />
                         </Button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                         {error && (
                              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                   <AlertCircle className="w-5 h-5 text-red-500" />
                                   <span className="text-red-700">{error}</span>
                              </div>
                         )}

                         {step === "email" && (
                              <div>
                                   <div className="text-center mb-6">
                                        <Mail className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                                        <p className="text-gray-600">
                                             Để đặt sân, bạn cần xác thực email. Chúng tôi sẽ gửi mã OTP đến email của bạn.
                                        </p>
                                   </div>

                                   <form onSubmit={handleEmailSubmit} className="space-y-4">
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">
                                                  Email *
                                             </label>
                                             <Input
                                                  type="email"
                                                  value={email}
                                                  onChange={(e) => setEmail(e.target.value)}
                                                  className={emailError ? "border-red-500" : ""}
                                                  placeholder="Nhập email của bạn"
                                                  required
                                             />
                                             {emailError && (
                                                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                                             )}
                                        </div>

                                        <Button
                                             type="submit"
                                             disabled={isLoading}
                                             className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold"
                                        >
                                             {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
                                        </Button>
                                   </form>
                              </div>
                         )}

                         {step === "otp" && (
                              <div>
                                   <div className="text-center mb-6">
                                        <Mail className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                                        <p className="text-gray-600">
                                             Chúng tôi đã gửi mã OTP đến <span className="font-medium">{email}</span>
                                        </p>
                                   </div>

                                   <form onSubmit={handleOtpSubmit} className="space-y-4">
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">
                                                  Mã OTP *
                                             </label>
                                             <Input
                                                  value={otp}
                                                  onChange={(e) => setOtp(e.target.value)}
                                                  className="text-center text-lg tracking-widest"
                                                  placeholder="Nhập mã 6 số"
                                                  maxLength="6"
                                                  required
                                             />
                                        </div>

                                        <div className="flex gap-3">
                                             <Button
                                                  type="button"
                                                  onClick={() => setStep("email")}
                                                  variant="outline"
                                                  className="flex-1"
                                             >
                                                  Quay lại
                                             </Button>
                                             <Button
                                                  type="submit"
                                                  disabled={isLoading}
                                                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold"
                                             >
                                                  {isLoading ? "Đang xác thực..." : "Xác thực"}
                                             </Button>
                                        </div>
                                   </form>
                              </div>
                         )}

                         {step === "success" && (
                              <div className="text-center py-6">
                                   <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                   <h3 className="text-xl font-bold text-gray-900 mb-2">Xác thực thành công!</h3>
                                   <p className="text-gray-600 mb-6">
                                        Email {email} đã được xác thực thành công. Bạn có thể tiếp tục đặt sân.
                                   </p>
                                   <Button
                                        onClick={handleClose}
                                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold"
                                   >
                                        Tiếp tục
                                   </Button>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
}
