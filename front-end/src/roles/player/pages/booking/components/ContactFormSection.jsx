import { User, Phone, Mail } from "lucide-react";
import { Input, Textarea } from "../../../../../shared/components/ui";

export default function ContactFormSection({
     bookingData,
     errors,
     onInputChange
}) {
     return (
          <div className="bg-teal-50 rounded-lg p-4">
               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-teal-600" />
                    Thông tin liên hệ
               </h3>
               <div className="space-y-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              <User className="w-4 h-4 inline mr-1" />
                              Họ và tên *
                         </label>
                         <Input
                              value={bookingData.customerName}
                              onChange={(e) => onInputChange("customerName", e.target.value)}
                              className={errors.customerName ? "border-red-500" : ""}
                              placeholder="Nhập họ và tên"
                         />
                         {errors.customerName && (
                              <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
                         )}
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Phone className="w-4 h-4 inline mr-1" />
                              Số điện thoại *
                         </label>
                         <Input
                              value={bookingData.customerPhone}
                              onChange={(e) => onInputChange("customerPhone", e.target.value)}
                              className={errors.customerPhone ? "border-red-500" : ""}
                              placeholder="Nhập số điện thoại"
                         />
                         {errors.customerPhone && (
                              <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>
                         )}
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Mail className="w-4 h-4 inline mr-1" />
                              Email {bookingData.requiresEmail ? "*" : ""}
                         </label>
                         <Input
                              type="email"
                              value={bookingData.customerEmail}
                              onChange={(e) => onInputChange("customerEmail", e.target.value)}
                              className={errors.customerEmail ? "border-red-500" : ""}
                              placeholder={bookingData.requiresEmail ? "Nhập email (bắt buộc)" : "Nhập email (tùy chọn)"}
                         />
                         {errors.customerEmail && (
                              <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>
                         )}
                         {bookingData.requiresEmail && (
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


