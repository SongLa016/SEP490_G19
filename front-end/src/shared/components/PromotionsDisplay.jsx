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
               <Card className={`p-4 bg-gradient-to-br from-gray-50 to-rose-50/30 border border-rose-200/50 rounded-2xl shadow-md ${className}`}>
                    <div className="text-center py-8">
                         <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center mx-auto mb-3 shadow-md">
                              <Gift className="w-8 h-8 text-white" />
                         </div>
                         <p className="text-gray-500 text-sm font-medium">Chưa có khuyến mãi nào</p>
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
          <Card className={`p-4 bg-gradient-to-br from-rose-50 via-pink-50/50 to-rose-50 border border-rose-200/50 rounded-2xl shadow-md hover:shadow-lg transition-shadow ${className}`}>
               <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-3">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-md">
                              <Gift className="w-5 h-5 text-white" />
                         </div>
                         <div>
                              <h3 className="text-base uppercase font-bold text-rose-800">Khuyến mãi hiện có</h3>
                              <div className="h-1 w-32 bg-gradient-to-r from-rose-400 via-pink-400 to-rose-400 rounded-full mx-auto mt-1" />
                         </div>
                    </div>

                    <div className="space-y-3">
                         {promotions.map((promotion) => {
                              const status = getPromotionStatus(promotion);
                              const isActive = status.text === "Đang áp dụng";

                              return (
                                   <div
                                        key={promotion.promotionId}
                                        className={`p-4 rounded-xl border shadow-sm transition-all ${isActive
                                             ? "bg-gradient-to-br from-rose-50/80 via-pink-50/60 to-rose-50/80 border-rose-300/50 hover:shadow-md"
                                             : "bg-gradient-to-br from-gray-50/80 via-slate-50/60 to-gray-50/80 border-gray-200/50"
                                             }`}
                                   >
                                        <div className="flex items-start justify-between mb-3">
                                             <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-2">
                                                       <h4 className={`font-bold ${isActive ? "text-rose-900" : "text-gray-700"}`}>{promotion.name}</h4>
                                                       <Badge className={status.color}>
                                                            {status.text}
                                                       </Badge>
                                                  </div>
                                                  <p className={`text-sm leading-relaxed ${isActive ? "text-rose-700" : "text-gray-600"}`}>{promotion.description}</p>
                                             </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                             <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 border border-rose-200/50">
                                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-sm">
                                                       <Tag className="w-3.5 h-3.5 text-white" />
                                                  </div>
                                                  <div>
                                                       <div className="text-xs text-gray-500">Mã</div>
                                                       <div className="font-bold text-rose-700 text-sm">{promotion.code}</div>
                                                  </div>
                                             </div>
                                             <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 border border-emerald-200/50">
                                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-sm">
                                                       <Percent className="w-3.5 h-3.5 text-white" />
                                                  </div>
                                                  <div>
                                                       <div className="text-xs text-gray-500">Giảm giá</div>
                                                       <div className="font-bold text-emerald-700 text-sm">
                                                            {formatPromotionValue(promotion)}
                                                       </div>
                                                  </div>
                                             </div>
                                             <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 border border-blue-200/50">
                                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
                                                       <Target className="w-3.5 h-3.5 text-white" />
                                                  </div>
                                                  <div>
                                                       <div className="text-xs text-gray-500">Tối thiểu</div>
                                                       <div className="font-semibold text-blue-700 text-xs">{promotion.minOrderAmount.toLocaleString("vi-VN")}₫</div>
                                                  </div>
                                             </div>
                                             <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 border border-teal-200/50">
                                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-sm">
                                                       <Users className="w-3.5 h-3.5 text-white" />
                                                  </div>
                                                  <div>
                                                       <div className="text-xs text-gray-500">Còn lại</div>
                                                       <div className="font-semibold text-teal-700 text-xs">{promotion.usageLimit - promotion.usedCount} lượt</div>
                                                  </div>
                                             </div>
                                        </div>

                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 border border-rose-200/50">
                                             <Calendar className="w-4 h-4 text-rose-600" />
                                             <span className="text-xs text-rose-700 font-medium">
                                                  Đến {new Date(promotion.endDate).toLocaleDateString("vi-VN")}
                                             </span>
                                        </div>

                                        {promotion.applicableSlots.length > 0 && (
                                             <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 border border-teal-200/50 mt-2">
                                                  <Clock className="w-4 h-4 text-teal-600" />
                                                  <span className="text-xs text-teal-700 font-medium">Áp dụng cho slot cụ thể</span>
                                             </div>
                                        )}
                                   </div>
                              );
                         })}
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-amber-50 via-yellow-50/50 to-amber-50 border border-amber-200/50 rounded-xl shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-sm flex-shrink-0">
                              <AlertTriangle className="w-4 h-4 text-white" />
                         </div>
                         <div className="text-sm text-amber-800 flex-1">
                              <div className="font-bold mb-2 text-amber-900">Cách sử dụng:</div>
                              <ul className="text-xs space-y-1.5">
                                   <li className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">•</span>
                                        <span>Nhập mã khuyến mãi khi thanh toán</span>
                                   </li>
                                   <li className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">•</span>
                                        <span>Mã chỉ áp dụng cho sân này</span>
                                   </li>
                                   <li className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">•</span>
                                        <span>Kiểm tra điều kiện áp dụng trước khi sử dụng</span>
                                   </li>
                              </ul>
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
