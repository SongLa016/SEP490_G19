import React from "react";
import { Card, Badge } from "../components/ui/index";
import {
     Shield,
     Clock,
     Percent,
     AlertTriangle,
     CheckCircle,
     Info
} from "lucide-react";
import { getCancellationPolicyRanges } from "../utils/cancellationCalculator";

export default function CancellationPolicyDisplay({ policy, className = "" }) {
     if (!policy) {
          return (
               <Card className={`p-4 bg-gradient-to-br from-gray-50 to-teal-50/30 border border-teal-200/50 rounded-2xl ${className}`}>
                    <div className="flex items-center gap-2 text-teal-600">
                         <Info className="w-5 h-5" />
                         <span className="text-sm font-medium">Chưa có thông tin chính sách hủy</span>
                    </div>
               </Card>
          );
     }

     const getPolicyStatus = () => {
          if (!policy.isActive) {
               return { text: "Tạm dừng", color: "bg-red-100 text-red-800" };
          }
          return { text: "Hoạt động", color: "bg-green-100 text-green-800" };
     };

     const status = getPolicyStatus();

     return (
          <Card className={`p-4 bg-gradient-to-br from-orange-50 via-amber-50/50 to-orange-50 border border-orange-200/50 rounded-2xl shadow-md hover:shadow-lg transition-shadow ${className}`}>
               <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
                                   <Shield className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                   <h3 className="text-base uppercase font-bold text-orange-800">Chính sách hủy</h3>
                                   <div className="h-1 w-32 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400 rounded-full mt-1" />
                              </div>
                         </div>

                         <Badge className={status.color}>
                              {status.text}
                         </Badge>
                    </div>

                    {/* Policy Name */}
                    <div className="bg-white/60 p-3 rounded-xl border border-orange-200/50">
                         <h4 className="font-semibold text-orange-900 mb-1">{policy.name}</h4>
                         {policy.description && (
                              <p className="text-sm text-orange-700 leading-relaxed">{policy.description}</p>
                         )}
                    </div>

                    {/* Cancellation Policy Table */}
                    <div className="space-y-3">
                         <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-semibold text-orange-900">Bảng chính sách hủy</span>
                         </div>
                         <div className="border-2 border-orange-200 rounded-xl overflow-hidden">
                              <table className="w-full">
                                   <thead>
                                        <tr className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                                             <th className="px-4 py-3 text-left text-xs font-bold">Mốc thời gian sau Confirm</th>
                                             <th className="px-4 py-3 text-center text-xs font-bold">Mức hoàn cọc</th>
                                             <th className="px-4 py-3 text-center text-xs font-bold">Mức phạt</th>
                                        </tr>
                                   </thead>
                                   <tbody>
                                        {getCancellationPolicyRanges().map((range, index) => (
                                             <tr
                                                  key={index}
                                                  className={`border-b border-orange-100 ${
                                                       index % 2 === 0 ? "bg-white" : "bg-orange-50/30"
                                                  }`}
                                             >
                                                  <td className="px-4 py-2.5">
                                                       <span className="text-xs font-medium text-gray-700">
                                                            {range.label}
                                                       </span>
                                                  </td>
                                                  <td className="px-4 py-2.5 text-center">
                                                       <span className={`text-xs font-semibold ${
                                                            range.refundRate === 100 ? "text-green-600" : 
                                                            range.refundRate === 0 ? "text-red-600" : 
                                                            "text-orange-600"
                                                       }`}>
                                                            {range.refundRate}% hoàn
                                                       </span>
                                                  </td>
                                                  <td className="px-4 py-2.5 text-center">
                                                       <span className={`text-xs font-semibold ${
                                                            range.penaltyRate === 0 ? "text-green-600" : 
                                                            range.penaltyRate === 100 ? "text-red-600" : 
                                                            "text-orange-600"
                                                       }`}>
                                                            {range.penaltyRate}% phạt
                                                       </span>
                                                  </td>
                                             </tr>
                                        ))}
                                   </tbody>
                              </table>
                         </div>
                    </div>

                    {/* Warning Message */}
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-amber-50 via-yellow-50/50 to-amber-50 border border-amber-200/50 rounded-xl shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-sm flex-shrink-0">
                              <AlertTriangle className="w-4 h-4 text-white" />
                         </div>
                         <div className="text-sm text-amber-800 flex-1">
                              <div className="font-bold mb-2 text-amber-900">Lưu ý quan trọng:</div>
                              <ul className="text-xs space-y-1.5">
                                   <li className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">•</span>
                                        <span>Thời gian tính từ lúc Confirm đến giờ bắt đầu sử dụng</span>
                                   </li>
                                   <li className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">•</span>
                                        <span>Hủy càng sớm càng được hoàn nhiều tiền cọc</span>
                                   </li>
                                   <li className="flex items-start gap-2">
                                        <span className="text-amber-600 font-bold">•</span>
                                        <span>Hủy sau 5 giờ sẽ không được hoàn tiền cọc</span>
                                   </li>
                              </ul>
                         </div>
                    </div>
               </div>
          </Card>
     );
}

// Component for displaying cancellation policy in booking flow
export function CancellationPolicySummary({ policy, bookingAmount, hoursUntilBooking }) {
     if (!policy) return null;

     const calculateFee = () => {
          if (hoursUntilBooking >= policy.freeCancellationHours) {
               return { fee: 0, percentage: 0, isFree: true };
          }

          const fee = (bookingAmount * policy.cancellationFeePercentage) / 100;
          return {
               fee: fee,
               percentage: policy.cancellationFeePercentage,
               isFree: false
          };
     };

     const feeInfo = calculateFee();

     return (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
               <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                         Chính sách hủy: {policy.name}
                    </span>
               </div>

               <div className="text-xs text-blue-800 space-y-1">
                    {feeInfo.isFree ? (
                         <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span>Hủy miễn phí (còn {hoursUntilBooking}h)</span>
                         </div>
                    ) : (
                         <div className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Phí hủy: {feeInfo.percentage}% (còn {hoursUntilBooking}h)</span>
                         </div>
                    )}

                    <div className="text-xs text-teal-600">
                         Miễn phí hủy trước {policy.freeCancellationHours}h
                    </div>
               </div>
          </div>
     );
}
