import React, { useState } from "react";
import { Card, Badge, Button } from "../components/ui/index";
import {
     Gift,
     Percent,
     Calendar,
     Clock,
     Tag,
     CheckCircle,
     AlertTriangle,
     Target,
     Users
} from "lucide-react";

export default function PromotionsDisplay({ promotions, className = "" }) {
     if (!promotions || promotions.length === 0) {
          return (
               <Card className={`p-4 ${className}`}>
                    <div className="text-center py-8">
                         <Gift className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                         <p className="text-gray-500 text-sm">Chưa có khuyến mãi nào</p>
                    </div>
               </Card>
          );
     }

     const getPromotionStatus = (promotion) => {
          const now = new Date();
          const startDate = new Date(promotion.startDate);
          const endDate = new Date(promotion.endDate);

          if (!promotion.isActive) {
               return { text: "Tạm dừng", color: "bg-red-100 text-red-800" };
          }

          if (now < startDate) {
               return { text: "Sắp diễn ra", color: "bg-yellow-100 text-yellow-800" };
          }

          if (now > endDate) {
               return { text: "Đã hết hạn", color: "bg-gray-100 text-gray-800" };
          }

          if (promotion.usedCount >= promotion.usageLimit) {
               return { text: "Hết lượt", color: "bg-orange-100 text-orange-800" };
          }

          return { text: "Đang áp dụng", color: "bg-green-100 text-green-800" };
     };

     const formatPromotionValue = (promotion) => {
          if (promotion.type === 'percentage') {
               return `Giảm ${promotion.value}%`;
          } else {
               return `Giảm ${promotion.value.toLocaleString("vi-VN")} VNĐ`;
          }
     };

     return (
          <Card className={`p-4 ${className}`}>
               <div className="space-y-4">
                    <div className="flex items-center gap-2">
                         <Gift className="w-5 h-5 text-purple-600" />
                         <h3 className="font-semibold text-gray-900">Khuyến mãi hiện có</h3>
                    </div>

                    <div className="space-y-3">
                         {promotions.map((promotion) => {
                              const status = getPromotionStatus(promotion);
                              const isActive = status.text === "Đang áp dụng";

                              return (
                                   <div
                                        key={promotion.promotionId}
                                        className={`p-3 rounded-lg border ${isActive
                                                  ? "bg-green-50 border-green-200"
                                                  : "bg-gray-50 border-gray-200"
                                             }`}
                                   >
                                        <div className="flex items-start justify-between mb-2">
                                             <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-1">
                                                       <h4 className="font-medium text-gray-900">{promotion.name}</h4>
                                                       <Badge className={status.color}>
                                                            {status.text}
                                                       </Badge>
                                                  </div>
                                                  <p className="text-sm text-gray-600 mb-2">{promotion.description}</p>
                                             </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                             <div className="flex items-center gap-1">
                                                  <Tag className="w-3 h-3 text-gray-500" />
                                                  <span className="font-medium">Mã: {promotion.code}</span>
                                             </div>
                                             <div className="flex items-center gap-1">
                                                  <Percent className="w-3 h-3 text-green-600" />
                                                  <span className="font-medium text-green-700">
                                                       {formatPromotionValue(promotion)}
                                                  </span>
                                             </div>
                                             <div className="flex items-center gap-1">
                                                  <Target className="w-3 h-3 text-gray-500" />
                                                  <span>Tối thiểu: {promotion.minOrderAmount.toLocaleString("vi-VN")} VNĐ</span>
                                             </div>
                                             <div className="flex items-center gap-1">
                                                  <Users className="w-3 h-3 text-gray-500" />
                                                  <span>Còn: {promotion.usageLimit - promotion.usedCount} lượt</span>
                                             </div>
                                        </div>

                                        <div className="mt-2 text-xs text-gray-500">
                                             <div className="flex items-center gap-1">
                                                  <Calendar className="w-3 h-3" />
                                                  <span>
                                                       Đến {new Date(promotion.endDate).toLocaleDateString("vi-VN")}
                                                  </span>
                                             </div>
                                        </div>

                                        {promotion.applicableSlots.length > 0 && (
                                             <div className="mt-2 text-xs text-blue-600">
                                                  <div className="flex items-center gap-1">
                                                       <Clock className="w-3 h-3" />
                                                       <span>Áp dụng cho slot cụ thể</span>
                                                  </div>
                                             </div>
                                        )}
                                   </div>
                              );
                         })}
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                         <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-blue-800">
                                   <div className="font-medium mb-1">Cách sử dụng:</div>
                                   <ul className="text-xs space-y-1">
                                        <li>• Nhập mã khuyến mãi khi thanh toán</li>
                                        <li>• Mã chỉ áp dụng cho sân này</li>
                                        <li>• Kiểm tra điều kiện áp dụng trước khi sử dụng</li>
                                   </ul>
                              </div>
                         </div>
                    </div>
               </div>
          </Card>
     );
}

// Component for displaying promotion code input in booking flow
export function PromotionCodeInput({
     onApplyCode,
     appliedPromotion,
     onRemoveCode,
     className = ""
}) {
     const [code, setCode] = useState("");
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState("");

     const handleApplyCode = async () => {
          if (!code.trim()) {
               setError("Vui lòng nhập mã khuyến mãi");
               return;
          }

          try {
               setLoading(true);
               setError("");
               await onApplyCode(code.trim().toUpperCase());
               setCode("");
          } catch (err) {
               setError(err.message || "Mã khuyến mãi không hợp lệ");
          } finally {
               setLoading(false);
          }
     };

     const handleRemoveCode = () => {
          setCode("");
          setError("");
          onRemoveCode();
     };

     return (
          <div className={`space-y-3 ${className}`}>
               <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-gray-900">Mã khuyến mãi</span>
               </div>

               {appliedPromotion ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                         <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                   <CheckCircle className="w-4 h-4 text-green-600" />
                                   <div>
                                        <div className="font-medium text-green-800">{appliedPromotion.name}</div>
                                        <div className="text-sm text-green-600">Mã: {appliedPromotion.code}</div>
                                   </div>
                              </div>
                              <Button
                                   type="button"
                                   variant="outline"
                                   size="sm"
                                   onClick={handleRemoveCode}
                                   className="text-red-600 hover:text-red-700"
                              >
                                   Xóa
                              </Button>
                         </div>
                    </div>
               ) : (
                    <div className="flex gap-2">
                         <input
                              type="text"
                              value={code}
                              onChange={(e) => setCode(e.target.value.toUpperCase())}
                              placeholder="Nhập mã khuyến mãi"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                              disabled={loading}
                         />
                         <Button
                              type="button"
                              onClick={handleApplyCode}
                              disabled={loading || !code.trim()}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                         >
                              {loading ? "Đang kiểm tra..." : "Áp dụng"}
                         </Button>
                    </div>
               )}

               {error && (
                    <div className="text-sm text-red-600 flex items-center gap-1">
                         <AlertTriangle className="w-4 h-4" />
                         {error}
                    </div>
               )}
          </div>
     );
}

// Component for displaying promotion summary in booking summary
export function PromotionSummary({ promotion, discountAmount, originalAmount, className = "" }) {
     if (!promotion) return null;

     const finalAmount = originalAmount - discountAmount;

     return (
          <div className={`p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
               <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">Đã áp dụng khuyến mãi</span>
               </div>

               <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                         <span className="text-gray-600">Tên khuyến mãi:</span>
                         <span className="font-medium">{promotion.name}</span>
                    </div>
                    <div className="flex justify-between">
                         <span className="text-gray-600">Mã:</span>
                         <span className="font-medium">{promotion.code}</span>
                    </div>
                    <div className="flex justify-between">
                         <span className="text-gray-600">Giá gốc:</span>
                         <span>{originalAmount.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                    <div className="flex justify-between">
                         <span className="text-gray-600">Giảm giá:</span>
                         <span className="text-green-600 font-medium">
                              -{discountAmount.toLocaleString("vi-VN")} VNĐ
                         </span>
                    </div>
                    <div className="flex justify-between border-t border-green-300 pt-1">
                         <span className="font-medium text-gray-900">Thành tiền:</span>
                         <span className="font-bold text-green-800">
                              {finalAmount.toLocaleString("vi-VN")} VNĐ
                         </span>
                    </div>
               </div>
          </div>
     );
}
