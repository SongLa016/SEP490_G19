import { useState, useCallback } from "react";
import { User, Phone, Mail } from "lucide-react";
import { Input, PhoneInput, Textarea } from "../../../../../shared/components/ui";

// Validate số điện thoại Việt Nam
const validatePhone = (phone) => {
     if (!phone?.trim()) return null;
     const phoneDigits = phone.replace(/\D/g, '');
     if (phoneDigits.length === 0) return null;
     if (phoneDigits.length !== 10) {
          return "Số điện thoại phải có đúng 10 chữ số";
     }
     if (!phoneDigits.startsWith('0')) {
          return "Số điện thoại phải bắt đầu bằng số 0";
     }
     if (!/^(03|05|07|08|09)\d{8}$/.test(phoneDigits)) {
          return "Số điện thoại không hợp lệ";
     }
     return null;
};

// Validate email
const validateEmail = (email) => {
     if (!email?.trim()) return null;
     const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
     if (!emailRegex.test(email.trim())) {
          return "Email không hợp lệ";
     }
     return null;
};

export default function ContactFormSection({
     bookingData,
     errors,
     onInputChange
}) {
     const [localErrors, setLocalErrors] = useState({});

     const handlePhoneChange = useCallback((e) => {
          const value = e.target.value;
          onInputChange("customerPhone", value);
          // Validate realtime
          const error = validatePhone(value);
          setLocalErrors(prev => ({ ...prev, customerPhone: error }));
     }, [onInputChange]);

     const handleEmailChange = useCallback((e) => {
          const value = e.target.value;
          onInputChange("customerEmail", value);
          // Validate realtime
          const error = validateEmail(value);
          setLocalErrors(prev => ({ ...prev, customerEmail: error }));
     }, [onInputChange]);

     // Combine local errors with parent errors (parent errors take priority)
     const phoneError = errors.customerPhone || localErrors.customerPhone;
     const emailError = errors.customerEmail || localErrors.customerEmail;

     return (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-teal-600" />
                    Thông tin liên hệ
               </h3>
               <div className="space-y-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              <User className="w-4 h-4 inline mr-1" />
                              Họ và tên <span className="text-red-500">*</span>
                         </label>
                         <Input
                              value={bookingData.customerName}
                              onChange={(e) => onInputChange("customerName", e.target.value)}
                              className={errors.customerName ? "border-red-500" : "border border-teal-200 rounded-lg"}
                              placeholder="Nhập họ và tên"
                         />
                         {errors.customerName && (
                              <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
                         )}
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Phone className="w-4 h-4 inline mr-1" />
                              Số điện thoại <span className="text-red-500">*</span>
                         </label>
                         <PhoneInput
                              value={bookingData.customerPhone}
                              onChange={handlePhoneChange}
                              maxLength={10}
                              className={phoneError ? "border-red-500" : "border border-teal-200 rounded-lg"}
                              placeholder="Nhập số điện thoại (VD: 0912345678)"
                         />
                         {phoneError && (
                              <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                         )}
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Mail className="w-4 h-4 inline mr-1" />
                              Email {bookingData.requiresEmail && <span className="text-red-500">*</span>}
                         </label>
                         <Input
                              type="email"
                              value={bookingData.customerEmail}
                              onChange={handleEmailChange}
                              className={emailError ? "border-red-500" : "border border-teal-200 rounded-lg"}
                              placeholder={bookingData.requiresEmail ? "Nhập email (VD: example@gmail.com)" : "Nhập email (tùy chọn)"}
                         />
                         {emailError && (
                              <p className="text-red-500 text-sm mt-1">{emailError}</p>
                         )}
                         {bookingData.requiresEmail && !emailError && (
                              <p className="text-gray-500 text-sm mt-1">Email cần thiết để xác nhận đặt sân</p>
                         )}
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                         <Textarea
                              value={bookingData.notes}
                              onChange={(e) => onInputChange("notes", e.target.value)}
                              placeholder="Ghi chú thêm (nếu có)"
                              rows={3}
                         />
                    </div>
               </div>
          </div>
     );
}

