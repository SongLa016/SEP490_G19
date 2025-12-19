import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Card } from "../../../shared/components/ui";
import {
     Shield,
     Clock,
     AlertTriangle,
     CheckCircle,
     Info
} from "lucide-react";
import {
     fetchCancellationPolicies
} from "../../../shared/index";
import { fetchComplexes } from "../../../shared/index";
import { getCancellationPolicyRanges } from "../../../shared/utils/cancellationCalculator";

export default function CancellationPolicies({ isDemo = false }) {
     const { user } = useAuth();
     const [policies, setPolicies] = useState([]);
     const [complexes, setComplexes] = useState([]);
     const [loading, setLoading] = useState(true);

     const loadData = useCallback(async () => {
          try {
               setLoading(true);
               const [policiesData, complexesData] = await Promise.all([
                    fetchCancellationPolicies(user?.id || 1),
                    fetchComplexes()
               ]);

               // Filter complexes owned by current user
               const ownerComplexes = complexesData.filter(complex =>
                    complex.complexId === 101 || complex.complexId === 102 || complex.complexId === 103
               );

               setPolicies(policiesData);
               setComplexes(ownerComplexes);
          } catch (error) {
               console.error('Error loading data:', error);
          } finally {
               setLoading(false);
          }
     }, [user?.id]);

     useEffect(() => {
          loadData();
     }, [loadData]);



     if (loading) {
          return (
               <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Đang tải...</div>
               </div>
          );
     }

     return (
          <div className="space-y-6">
               <div className="flex items-center justify-between">
                    <div>
                         <h1 className="text-3xl font-bold text-gray-900">Chính sách hủy</h1>
                         <p className="text-gray-600 mt-1">Xem chính sách hủy mặc định cho các sân của bạn</p>
                    </div>
               </div>

               {/* Default Policy Card */}
               <Card className="p-6 bg-gradient-to-br from-orange-50 via-amber-50/50 to-orange-50 border border-orange-200/50">
                    <div className="space-y-3">
                         {/* Header */}
                         <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
                                        <Shield className="w-5 h-5 text-white" />
                                   </div>
                                   <div>
                                        <h3 className="text-base uppercase font-bold text-orange-800">Chính sách hủy</h3>
                                        <div className="h-1 w-32 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400 rounded-full mt-1" />
                                   </div>
                              </div>
                              <div className="flex items-center gap-1">
                                   <CheckCircle className="w-4 h-4 text-green-500" />
                                   <span className="text-sm text-green-600 font-medium">Hoạt động</span>
                              </div>
                         </div>

                         {/* Policy Name */}
                         <div className="bg-white/60 p-3 rounded-xl border border-orange-200/50">
                              <h4 className="font-semibold text-orange-900 mb-1">Chính sách hủy cho các sân nhỏ</h4>
                              <p className="text-sm text-orange-700 leading-relaxed">
                                   Mức hoàn cọc và mức phạt sẽ được tính theo các mốc thời gian sau khi chủ sân xác nhận đặt sân.
                              </p>
                         </div>

                         {/* Cancellation Policy Table */}
                         <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                   <Clock className="w-4 h-4 text-orange-600" />
                                   <span className="text-sm font-semibold text-orange-900">Bảng chính sách hủy</span>
                              </div>
                              <div className="border-2 border-orange-200 rounded-xl overflow-hidden">
                                   <table className="w-full">
                                        <thead>
                                             <tr className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                                                  <th className="px-4 py-3 text-left text-xs font-bold">Mốc thời gian sau xác nhận</th>
                                                  <th className="px-4 py-3 text-center text-xs font-bold">Mức hoàn cọc</th>
                                                  <th className="px-4 py-3 text-center text-xs font-bold">Mức phạt</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             {getCancellationPolicyRanges().map((range, index) => (
                                                  <tr
                                                       key={index}
                                                       className={`border-b border-orange-100 ${index % 2 === 0 ? "bg-white" : "bg-orange-50/30"
                                                            }`}
                                                  >
                                                       <td className="px-4 py-2.5">
                                                            <span className="text-xs font-medium text-gray-700">
                                                                 {range.label}
                                                            </span>
                                                       </td>
                                                       <td className="px-4 py-2.5 text-center">
                                                            <span className={`text-xs font-semibold  ${range.refundRate === 100 ? "text-green-600" :
                                                                 range.refundRate === 0 ? "text-red-600" :
                                                                      "text-blue-600"
                                                                 }`}>
                                                                 {range.refundRate}% hoàn
                                                            </span>
                                                       </td>
                                                       <td className="px-4 py-2.5 text-center">
                                                            <span className={`text-xs font-semibold  ${range.penaltyRate === 0 ? "text-green-600" :
                                                                 range.penaltyRate === 100 ? "text-red-600" :
                                                                      "text-blue-600"
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
                                             <span>Thời gian tính từ lúc xác nhận đến giờ bắt đầu sử dụng</span>
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

                         {/* Info Message */}
                         <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-blue-800">
                                   <span className="font-semibold">Chính sách mặc định:</span> Chính sách này sẽ được áp dụng cho tất cả các sân. Chức năng tạo chính sách hủy tùy chỉnh sẽ được phát triển sau.
                              </div>
                         </div>
                    </div>
               </Card>
          </div >
     );
}

