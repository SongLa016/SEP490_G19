import React, { useState, useEffect } from "react";
import { Card, Button, Input } from "./ui";
import {
     Gift,
     CheckCircle,
     AlertTriangle,
     X,
     Percent,
     Tag,
} from "lucide-react";
import { validatePromotionCode, calculateDiscountAmount } from "../services/promotions";

export default function PromotionCodeSection({
     complexId,
     slotId,
     dayOfWeek,
     orderAmount,
     onPromotionApplied,
     className = ""
}) {
     const [code, setCode] = useState("");
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState("");
     const [appliedPromotion, setAppliedPromotion] = useState(null);
     const [discountInfo, setDiscountInfo] = useState(null);

     const handleApplyCode = async () => {
          if (!code.trim()) {
               setError("Vui lòng nhập mã khuyến mãi");
               return;
          }

          try {
               setLoading(true);
               setError("");

               const result = await validatePromotionCode(
                    code.trim().toUpperCase(),
                    complexId,
                    slotId,
                    dayOfWeek,
                    orderAmount
               );

               if (result.valid) {
                    const discount = calculateDiscountAmount(result.promotion, orderAmount);
                    setAppliedPromotion(result.promotion);
                    setDiscountInfo(discount);
                    onPromotionApplied(result.promotion, discount);
                    setCode("");
               } else {
                    setError(result.message);
               }
          } catch (err) {
               setError("Có lỗi xảy ra khi kiểm tra mã khuyến mãi");
          } finally {
               setLoading(false);
          }
     };

     const handleRemoveCode = () => {
          setCode("");
          setError("");
          setAppliedPromotion(null);
          setDiscountInfo(null);
          onPromotionApplied(null, null);
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
                         <h3 className="font-semibold text-gray-900">Mã khuyến mãi</h3>
                    </div>

                    {appliedPromotion ? (
                         <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                   <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="font-medium text-green-800">Đã áp dụng thành công</span>
                                   </div>
                                   <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRemoveCode}
                                        className="text-red-600 hover:text-red-700"
                                   >
                                        <X className="w-4 h-4" />
                                   </Button>
                              </div>

                              <div className="space-y-2">
                                   <div className="text-sm">
                                        <div className="font-medium text-green-800">{appliedPromotion.name}</div>
                                        <div className="text-green-600">Mã: {appliedPromotion.code}</div>
                                   </div>

                                   <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex items-center gap-1">
                                             <Percent className="w-3 h-3 text-green-600" />
                                             <span>{formatPromotionValue(appliedPromotion)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                             <Tag className="w-3 h-3 text-gray-500" />
                                             <span>Tối thiểu: {appliedPromotion.minOrderAmount.toLocaleString("vi-VN")} VNĐ</span>
                                        </div>
                                   </div>

                                   {discountInfo && (
                                        <div className="pt-2 border-t border-green-300">
                                             <div className="flex justify-between text-sm">
                                                  <span className="text-gray-600">Giá gốc:</span>
                                                  <span>{orderAmount.toLocaleString("vi-VN")} VNĐ</span>
                                             </div>
                                             <div className="flex justify-between text-sm">
                                                  <span className="text-gray-600">Giảm giá:</span>
                                                  <span className="text-green-600 font-medium">
                                                       -{discountInfo.discountAmount.toLocaleString("vi-VN")} VNĐ
                                                  </span>
                                             </div>
                                             <div className="flex justify-between text-sm font-bold">
                                                  <span className="text-gray-900">Thành tiền:</span>
                                                  <span className="text-green-800">
                                                       {discountInfo.finalAmount.toLocaleString("vi-VN")} VNĐ
                                                  </span>
                                             </div>
                                        </div>
                                   )}
                              </div>
                         </div>
                    ) : (
                         <div className="space-y-3">
                              <div className="flex gap-2">
                                   <Input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        placeholder="Nhập mã khuyến mãi"
                                        className="flex-1"
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

                              {error && (
                                   <div className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        {error}
                                   </div>
                              )}
                         </div>
                    )}

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                         <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-blue-800">
                                   <div className="font-medium mb-1">Lưu ý:</div>
                                   <ul className="text-xs space-y-1">
                                        <li>• Mã khuyến mãi chỉ áp dụng cho sân này</li>
                                        <li>• Kiểm tra điều kiện áp dụng trước khi sử dụng</li>
                                        <li>• Mỗi mã chỉ sử dụng được một lần</li>
                                   </ul>
                              </div>
                         </div>
                    </div>
               </div>
          </Card>
     );
}

// Component for displaying available promotions in booking flow
export function AvailablePromotions({ promotions, className = "" }) {
     if (!promotions || promotions.length === 0) {
          return null;
     }

     const activePromotions = promotions.filter(p => {
          const now = new Date();
          const startDate = new Date(p.startDate);
          const endDate = new Date(p.endDate);

          return p.isActive &&
               now >= startDate &&
               now <= endDate &&
               p.usedCount < p.usageLimit;
     });

     if (activePromotions.length === 0) {
          return null;
     }

     return (
          <Card className={`p-4 ${className}`}>
               <div className="space-y-3">
                    <div className="flex items-center gap-2">
                         <Gift className="w-4 h-4 text-purple-600" />
                         <span className="font-medium text-gray-900">Khuyến mãi có sẵn</span>
                    </div>

                    <div className="space-y-2">
                         {activePromotions.slice(0, 3).map((promotion) => (
                              <div
                                   key={promotion.promotionId}
                                   className="p-2 bg-purple-50 border border-purple-200 rounded-lg"
                              >
                                   <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                             <div className="font-medium text-purple-800 text-sm">
                                                  {promotion.name}
                                             </div>
                                             <div className="text-xs text-purple-600">
                                                  Mã: {promotion.code}
                                             </div>
                                        </div>
                                        <div className="text-right">
                                             <div className="text-sm font-medium text-purple-800">
                                                  {promotion.type === 'percentage'
                                                       ? `Giảm ${promotion.value}%`
                                                       : `Giảm ${promotion.value.toLocaleString("vi-VN")} VNĐ`
                                                  }
                                             </div>
                                             <div className="text-xs text-purple-600">
                                                  Còn {promotion.usageLimit - promotion.usedCount} lượt
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         ))}
                    </div>

                    {activePromotions.length > 3 && (
                         <div className="text-xs text-gray-500 text-center">
                              Và {activePromotions.length - 3} khuyến mãi khác...
                         </div>
                    )}
               </div>
          </Card>
     );
}
