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

export default function CancellationPolicyDisplay({ policy, className = "" }) {
     if (!policy) {
          return (
               <Card className={`p-4 ${className}`}>
                    <div className="flex items-center gap-2 text-gray-500">
                         <Info className="w-4 h-4" />
                         <span className="text-sm">Chưa có thông tin chính sách hủy</span>
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
          <Card className={`p-4 ${className}`}>
               <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                         <div className="flex items-center gap-2">
                              <Shield className="w-5 h-5 text-blue-600" />
                              <h3 className="font-semibold text-gray-900">Chính sách hủy</h3>
                         </div>
                         <Badge className={status.color}>
                              {status.text}
                         </Badge>
                    </div>

                    {/* Policy Name */}
                    <div>
                         <h4 className="font-medium text-gray-900">{policy.name}</h4>
                         {policy.description && (
                              <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                         )}
                    </div>

                    {/* Policy Details */}
                    <div className="grid grid-cols-2 gap-4">
                         <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <div>
                                   <div className="text-sm font-medium text-gray-900">
                                        Hủy miễn phí
                                   </div>
                                   <div className="text-sm text-gray-600">
                                        Trước {policy.freeCancellationHours}h
                                   </div>
                              </div>
                         </div>

                         <div className="flex items-center gap-2">
                              <Percent className="w-4 h-4 text-gray-500" />
                              <div>
                                   <div className="text-sm font-medium text-gray-900">
                                        Phí hủy
                                   </div>
                                   <div className="text-sm text-gray-600">
                                        {policy.cancellationFeePercentage}% giá trị đặt sân
                                   </div>
                              </div>
                         </div>
                    </div>

                    {/* Warning Message */}
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                         <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                         <div className="text-sm text-amber-800">
                              <div className="font-medium mb-1">Lưu ý quan trọng:</div>
                              <ul className="text-xs space-y-1">
                                   <li>• Hủy trước {policy.freeCancellationHours} giờ: Hoàn tiền 100%</li>
                                   <li>• Hủy sau {policy.freeCancellationHours} giờ: Phí hủy {policy.cancellationFeePercentage}%</li>
                                   <li>• Thời gian tính từ lúc đặt sân đến giờ bắt đầu sử dụng</li>
                              </ul>
                         </div>
                    </div>

                    {/* Example Calculation */}
                    <div className="p-3 bg-gray-50 rounded-md">
                         <div className="text-sm font-medium text-gray-900 mb-2">
                              Ví dụ tính phí hủy:
                         </div>
                         <div className="text-xs text-gray-600 space-y-1">
                              <div>• Đặt sân: 500,000 VNĐ</div>
                              <div>• Hủy trước 12h: Hoàn 500,000 VNĐ</div>
                              <div>• Hủy sau 12h: Hoàn 350,000 VNĐ (phí {policy.cancellationFeePercentage}%)</div>
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

                    <div className="text-xs text-gray-600">
                         Miễn phí hủy trước {policy.freeCancellationHours}h
                    </div>
               </div>
          </div>
     );
}
