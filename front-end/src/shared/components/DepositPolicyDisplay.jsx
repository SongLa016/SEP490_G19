import React from "react";
import { Card } from "../components/ui/index";
import {
     Wallet,
     Percent,
     DollarSign,
     Info
} from "lucide-react";

export default function DepositPolicyDisplay({ policy, className = "" }) {
     if (!policy) {
          return (
               <Card className={`p-4 bg-gradient-to-br from-gray-50 to-pink-50/30 border border-pink-200/50 rounded-2xl ${className}`}>
                    <div className="flex items-center gap-2 text-pink-600">
                         <Info className="w-5 h-5" />
                         <span className="text-sm font-medium">Chưa có thông tin chính sách đặt cọc</span>
                    </div>
               </Card>
          );
     }

     const depositPercent = policy.depositPercent || 0;
     const minDeposit = policy.minDeposit || 0;
     const maxDeposit = policy.maxDeposit || 0;

     return (
          <Card className={`p-4 bg-gradient-to-br from-pink-50 via-rose-50/50 to-pink-50 border border-pink-200/50 rounded-2xl shadow-md hover:shadow-lg transition-shadow ${className}`}>
               <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md">
                              <Wallet className="w-5 h-5 text-white" />
                         </div>
                         <div>
                              <h3 className="text-base font-bold text-pink-800">Chính sách đặt cọc</h3>
                              <div className="h-1 w-32 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 rounded-full mt-1" />
                         </div>
                    </div>

                    {/* Deposit Percent */}
                    {depositPercent > 0 && (
                         <div className="flex items-center justify-between rounded-2xl p-2 bg-white/60 border border-pink-200/50">
                              <div className="flex items-center gap-2">
                                   <Percent className="w-4 h-4 text-pink-600" />
                                   <span className="text-sm font-medium text-gray-700">Tỷ lệ đặt cọc</span>
                              </div>
                              <span className="text-base font-bold text-pink-700">{depositPercent}%</span>
                         </div>
                    )}

                    {/* Min Deposit */}
                    {minDeposit > 0 && (
                         <div className="flex items-center justify-between rounded-2xl p-2 bg-white/60 border border-pink-200/50">
                              <div className="flex items-center gap-2">
                                   <DollarSign className="w-4 h-4 text-pink-600" />
                                   <span className="text-sm font-medium text-gray-700">Đặt cọc tối thiểu</span>
                              </div>
                              <span className="text-base font-bold text-pink-700">
                                   {minDeposit.toLocaleString("vi-VN")}₫
                              </span>
                         </div>
                    )}

                    {/* Max Deposit */}
                    {maxDeposit > 0 && (
                         <div className="flex items-center justify-between rounded-2xl p-2 bg-white/60 border border-pink-200/50">
                              <div className="flex items-center gap-2">
                                   <DollarSign className="w-4 h-4 text-pink-600" />
                                   <span className="text-sm font-medium text-gray-700">Đặt cọc tối đa</span>
                              </div>
                              <span className="text-base font-bold text-pink-700">
                                   {maxDeposit.toLocaleString("vi-VN")}₫
                              </span>
                         </div>
                    )}

                    {/* Note */}
                    <div className="mt-3">
                         <p className="text-xs text-pink-700">
                              <strong>Lưu ý:</strong> Số tiền đặt cọc sẽ được tính dựa trên tỷ lệ đặt cọc và giá trị đặt sân, trong khoảng từ {minDeposit > 0 ? `${minDeposit.toLocaleString("vi-VN")}₫` : "không giới hạn"} đến {maxDeposit > 0 ? `${maxDeposit.toLocaleString("vi-VN")}₫` : "không giới hạn"}.
                         </p>
                    </div>
               </div>
          </Card>
     );
}

