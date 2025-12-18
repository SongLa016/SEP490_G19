import { useState } from "react";
import { Eye, EyeOff, Lock, X, Check } from "lucide-react";
import {
     Modal,
     Input,
     Button,
     LoadingSpinner,
} from "./ui";
import { profileService } from "../services/profileService";
import Swal from "sweetalert2";

/**
 * Modal đổi mật khẩu dùng chung cho Owner và Admin
 * @param {boolean} isOpen - Trạng thái mở/đóng modal
 * @param {function} onClose - Callback khi đóng modal
 * @param {string} accentColor - Màu chủ đạo (teal cho owner, red cho admin)
 */
export default function ChangePasswordModal({ isOpen, onClose, accentColor = "teal" }) {
     const [isLoading, setIsLoading] = useState(false);
     const [showCurrentPassword, setShowCurrentPassword] = useState(false);
     const [showNewPassword, setShowNewPassword] = useState(false);
     const [showConfirmPassword, setShowConfirmPassword] = useState(false);
     const [formData, setFormData] = useState({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
     });
     const [errors, setErrors] = useState({});

     // Validation rules
     const validateForm = () => {
          const newErrors = {};

          // Current password validation
          if (!formData.currentPassword.trim()) {
               newErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
          }

          // New password validation
          if (!formData.newPassword) {
               newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
          } else if (formData.newPassword.length < 6) {
               newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
          } else if (formData.newPassword.length > 100) {
               newErrors.newPassword = "Mật khẩu không được vượt quá 100 ký tự";
          } else if (!/[A-Z]/.test(formData.newPassword)) {
               newErrors.newPassword = "Mật khẩu phải chứa ít nhất 1 chữ hoa";
          } else if (!/[a-z]/.test(formData.newPassword)) {
               newErrors.newPassword = "Mật khẩu phải chứa ít nhất 1 chữ thường";
          } else if (!/[0-9]/.test(formData.newPassword)) {
               newErrors.newPassword = "Mật khẩu phải chứa ít nhất 1 số";
          } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)) {
               newErrors.newPassword = "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt";
          } else if (formData.newPassword === formData.currentPassword) {
               newErrors.newPassword = "Mật khẩu mới không được trùng với mật khẩu hiện tại";
          }

          // Confirm password validation
          if (!formData.confirmPassword) {
               newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
          } else if (formData.confirmPassword !== formData.newPassword) {
               newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
          }

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
     };

     const handleInputChange = (field, value) => {
          setFormData((prev) => ({
               ...prev,
               [field]: value,
          }));
          // Clear error when user starts typing
          if (errors[field]) {
               setErrors((prev) => ({
                    ...prev,
                    [field]: "",
               }));
          }
     };

     const handleSubmit = async (e) => {
          e.preventDefault();

          // Check token before calling API
          const token = localStorage.getItem("token");
          if (!token) {
               Swal.fire({
                    icon: "warning",
                    title: "Phiên đăng nhập hết hạn",
                    text: "Vui lòng đăng nhập lại để tiếp tục",
                    confirmButtonText: "Đóng",
               });
               return;
          }

          if (!validateForm()) {
               return;
          }

          setIsLoading(true);

          try {
               const result = await profileService.changePassword(
                    formData.currentPassword,
                    formData.newPassword,
                    formData.confirmPassword
               );

               if (result.ok) {
                    Swal.fire({
                         icon: "success",
                         title: "Thành công",
                         text: result.message || "Đổi mật khẩu thành công",
                         confirmButtonText: "Đóng",
                         timer: 2000,
                         timerProgressBar: true,
                    });
                    handleClose();
               } else {
                    Swal.fire({
                         icon: "error",
                         title: "Lỗi",
                         text: result.reason || "Đổi mật khẩu thất bại",
                         confirmButtonText: "Đóng",
                    });
               }
          } catch (error) {
               Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: error.message || "Có lỗi xảy ra khi đổi mật khẩu",
                    confirmButtonText: "Đóng",
               });
          } finally {
               setIsLoading(false);
          }
     };

     const handleClose = () => {
          setFormData({
               currentPassword: "",
               newPassword: "",
               confirmPassword: "",
          });
          setErrors({});
          setShowCurrentPassword(false);
          setShowNewPassword(false);
          setShowConfirmPassword(false);
          onClose();
     };

     // Password strength indicator
     const getPasswordStrength = (password) => {
          if (!password) return { strength: 0, label: "", color: "gray" };

          let strength = 0;
          if (password.length >= 6) strength++;
          if (password.length >= 10) strength++;
          if (/[A-Z]/.test(password)) strength++;
          if (/[a-z]/.test(password)) strength++;
          if (/[0-9]/.test(password)) strength++;
          if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

          if (strength <= 2) return { strength: 1, label: "Yếu", color: "red" };
          if (strength <= 4) return { strength: 2, label: "Trung bình", color: "yellow" };
          return { strength: 3, label: "Mạnh", color: "green" };
     };

     const passwordStrength = getPasswordStrength(formData.newPassword);

     const MAX_LENGTH = 100;
     const WARNING_THRESHOLD = 90;

     // Helper function to get character count warning
     const getCharCountClass = (length) => {
          if (length >= MAX_LENGTH) return "text-red-500 font-medium";
          if (length >= WARNING_THRESHOLD) return "text-yellow-600";
          return "text-gray-400";
     };

     const colorClasses = {
          teal: {
               button: "bg-teal-600 hover:bg-teal-700",
               focus: "focus:ring-teal-500 focus:border-teal-500",
               text: "text-teal-600",
          },
          red: {
               button: "bg-red-600 hover:bg-red-700",
               focus: "focus:ring-red-500 focus:border-red-500",
               text: "text-red-600",
          },
     };

     const colors = colorClasses[accentColor] || colorClasses.teal;

     if (!isOpen) return null;

     return (
          <Modal isOpen={isOpen}
               size="md"
               onClose={handleClose}
               className="rounded-2xl"
          >

               {/* Header */}
               <div className={`px-6 py-4 ${accentColor === "red" ? "bg-gradient-to-r from-red-600 to-pink-600" : "bg-gradient-to-r from-teal-600 to-teal-700"} text-white`}>
                    <div className="flex items-center justify-between">
                         <h2 className="text-xl font-bold flex items-center gap-2">
                              <Lock className="w-5 h-5" />
                              Đổi mật khẩu
                         </h2>
                         <button
                              onClick={handleClose}
                              className="p-1 hover:bg-white/20 rounded-full transition"
                         >
                              <X className="w-5 h-5" />
                         </button>
                    </div>
               </div>

               {/* Form */}
               <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Current Password */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mật khẩu hiện tại <span className="text-red-500">*</span>
                         </label>
                         <div className="relative">
                              <Input
                                   type={showCurrentPassword ? "text" : "password"}
                                   value={formData.currentPassword}
                                   onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                                   placeholder="Nhập mật khẩu hiện tại"
                                   maxLength={100}
                                   className={`w-full pr-10 ${errors.currentPassword ? "border-red-500" : ""}`}
                              />
                              <button
                                   type="button"
                                   onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                   {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                         </div>
                         <div className="flex justify-between items-center mt-1">
                              {errors.currentPassword ? (
                                   <p className="text-red-500 text-sm">{errors.currentPassword}</p>
                              ) : <span />}
                              <span className={`text-xs ${getCharCountClass(formData.currentPassword.length)}`}>
                                   {formData.currentPassword.length}/{MAX_LENGTH}
                                   {formData.currentPassword.length >= MAX_LENGTH && " (đã đạt giới hạn)"}
                              </span>
                         </div>
                    </div>

                    {/* New Password */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mật khẩu mới <span className="text-red-500">*</span>
                         </label>
                         <div className="relative">
                              <Input
                                   type={showNewPassword ? "text" : "password"}
                                   value={formData.newPassword}
                                   onChange={(e) => handleInputChange("newPassword", e.target.value)}
                                   placeholder="Nhập mật khẩu mới"
                                   maxLength={100}
                                   className={`w-full pr-10 ${errors.newPassword ? "border-red-500" : ""}`}
                              />
                              <button
                                   type="button"
                                   onClick={() => setShowNewPassword(!showNewPassword)}
                                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                   {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                         </div>
                         <div className="flex justify-between items-center mt-1">
                              {errors.newPassword ? (
                                   <p className="text-red-500 text-sm">{errors.newPassword}</p>
                              ) : <span />}
                              <span className={`text-xs ${getCharCountClass(formData.newPassword.length)}`}>
                                   {formData.newPassword.length}/{MAX_LENGTH}
                                   {formData.newPassword.length >= MAX_LENGTH && " (đã đạt giới hạn)"}
                              </span>
                         </div>

                         {/* Password strength indicator */}
                         {formData.newPassword && (
                              <div className="mt-2">
                                   <div className="flex gap-1 mb-1">
                                        {[1, 2, 3].map((level) => (
                                             <div
                                                  key={level}
                                                  className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.strength >= level
                                                       ? passwordStrength.color === "red"
                                                            ? "bg-red-500"
                                                            : passwordStrength.color === "yellow"
                                                                 ? "bg-yellow-500"
                                                                 : "bg-green-500"
                                                       : "bg-gray-200"
                                                       }`}
                                             />
                                        ))}
                                   </div>
                                   <p className={`text-xs ${passwordStrength.color === "red"
                                        ? "text-red-500"
                                        : passwordStrength.color === "yellow"
                                             ? "text-yellow-600"
                                             : "text-green-500"
                                        }`}>
                                        Độ mạnh: {passwordStrength.label}
                                   </p>
                              </div>
                         )}

                         {/* Password requirements */}
                         <div className="mt-2 text-xs text-gray-500 space-y-1">
                              <p className="font-medium">Yêu cầu mật khẩu:</p>
                              <ul className="space-y-0.5 ml-2">
                                   <li className={`flex items-center gap-1 ${formData.newPassword.length >= 6 ? "text-green-600" : ""}`}>
                                        {formData.newPassword.length >= 6 ? <Check className="w-3 h-3" /> : <span className="w-3 h-3">•</span>}
                                        Ít nhất 6 ký tự
                                   </li>
                                   <li className={`flex items-center gap-1 ${/[A-Z]/.test(formData.newPassword) ? "text-green-600" : ""}`}>
                                        {/[A-Z]/.test(formData.newPassword) ? <Check className="w-3 h-3" /> : <span className="w-3 h-3">•</span>}
                                        Ít nhất 1 chữ hoa
                                   </li>
                                   <li className={`flex items-center gap-1 ${/[a-z]/.test(formData.newPassword) ? "text-green-600" : ""}`}>
                                        {/[a-z]/.test(formData.newPassword) ? <Check className="w-3 h-3" /> : <span className="w-3 h-3">•</span>}
                                        Ít nhất 1 chữ thường
                                   </li>
                                   <li className={`flex items-center gap-1 ${/[0-9]/.test(formData.newPassword) ? "text-green-600" : ""}`}>
                                        {/[0-9]/.test(formData.newPassword) ? <Check className="w-3 h-3" /> : <span className="w-3 h-3">•</span>}
                                        Ít nhất 1 số
                                   </li>
                                   <li className={`flex items-center gap-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) ? "text-green-600" : ""}`}>
                                        {/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) ? <Check className="w-3 h-3" /> : <span className="w-3 h-3">•</span>}
                                        Ít nhất 1 ký tự đặc biệt
                                   </li>
                              </ul>
                         </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                         </label>
                         <div className="relative">
                              <Input
                                   type={showConfirmPassword ? "text" : "password"}
                                   value={formData.confirmPassword}
                                   onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                   placeholder="Nhập lại mật khẩu mới"
                                   maxLength={100}
                                   className={`w-full pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                              />
                              <button
                                   type="button"
                                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                   {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                         </div>
                         <div className="flex justify-between items-center mt-1">
                              {errors.confirmPassword ? (
                                   <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                              ) : formData.confirmPassword && formData.confirmPassword === formData.newPassword ? (
                                   <p className="text-green-600 text-sm flex items-center gap-1">
                                        <Check className="w-4 h-4" /> Mật khẩu khớp
                                   </p>
                              ) : <span />}
                              <span className={`text-xs ${getCharCountClass(formData.confirmPassword.length)}`}>
                                   {formData.confirmPassword.length}/{MAX_LENGTH}
                                   {formData.confirmPassword.length >= MAX_LENGTH && " (đã đạt giới hạn)"}
                              </span>
                         </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                         <Button
                              type="button"
                              onClick={handleClose}
                              variant="outline"
                              className="flex-1"
                              disabled={isLoading}
                         >
                              Hủy
                         </Button>
                         <Button
                              type="submit"
                              className={`flex-1 text-white ${colors.button}`}
                              disabled={isLoading}
                         >
                              {isLoading ? (
                                   <>
                                        <LoadingSpinner className="w-4 h-4 mr-2" />
                                        Đang xử lý...
                                   </>
                              ) : (
                                   "Đổi mật khẩu"
                              )}
                         </Button>
                    </div>
               </form>

          </Modal>
     );
}
