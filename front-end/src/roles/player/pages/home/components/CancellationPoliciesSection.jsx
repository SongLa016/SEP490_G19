import { Button, Card, Container } from "../../../../../shared/components/ui";
import { Shield, Clock, Percent, Info, ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { fetchFieldComplexes } from "../../../../../shared/services/fields";
import { fetchCancellationPolicyByComplex } from "../../../../../shared/services/cancellationPolicies";
import { getCancellationPolicyRanges } from "../../../../../shared/utils/cancellationCalculator";

// Chính sách mặc định
const defaultPolicy = {
     id: "default",
     name: "Chính sách hủy mặc định",
     description: "Mức hoàn cọc và mức phạt sẽ được tính theo các mốc thời gian sau khi chủ sân xác nhận đặt sân.",
     isDefault: true,
     ranges: getCancellationPolicyRanges(),
};

export const CancellationPoliciesSection = () => {
     const navigate = useNavigate();
     const [policies, setPolicies] = useState([]);
     const [allPolicies, setAllPolicies] = useState([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          const loadPolicies = async () => {
               try {
                    setLoading(true);
                    // Fetch all complexes
                    let complexes = [];
                    try {
                         complexes = await fetchFieldComplexes();
                         if (!Array.isArray(complexes)) {
                              complexes = [];
                         }
                         // Filter only Active complexes for Player
                         complexes = complexes.filter(
                              (complex) => (complex.status || complex.Status || "Active") === "Active"
                         );
                    } catch (error) {
                         console.error("Error fetching complexes:", error);
                         complexes = [];
                    }

                    // Fetch policies from all complexes
                    const policyPromises = complexes.map(complex =>
                         fetchCancellationPolicyByComplex(complex.complexId).catch(() => null)
                    );
                    const allPolicies = await Promise.all(policyPromises);

                    // Filter active policies and get unique ones
                    const activePolicies = allPolicies
                         .filter(policy => policy && policy.isActive)
                         .map(policy => {
                              return {
                                   id: policy.policyId,
                                   name: policy.name || "Chính sách hủy",
                                   description: policy.description || "Chính sách hủy đặt sân",
                                   freeCancellationHours: policy.freeCancellationHours || 0,
                                   cancellationFeePercentage: policy.cancellationFeePercentage || 0,
                                   complexId: policy.complexId,
                              };
                         });

                    // Remove duplicates based on policyId
                    const uniquePolicies = activePolicies.filter((policy, index, self) =>
                         index === self.findIndex(p => p.id === policy.id)
                    );

                    // Always include default policy at the beginning for left column (limit to 2)
                    const finalPolicies = [defaultPolicy, ...uniquePolicies].slice(0, 2);

                    // Store all policies for right column
                    setPolicies(finalPolicies);
                    setAllPolicies([defaultPolicy, ...uniquePolicies]);
               } catch (error) {
                    console.error("Error loading cancellation policies:", error);
                    // Nếu có lỗi, vẫn hiển thị chính sách mặc định
                    setPolicies([defaultPolicy]);
                    setAllPolicies([defaultPolicy]);
               } finally {
                    setLoading(false);
               }
          };

          loadPolicies();
     }, []);

     const formatHours = (hours) => {
          if (hours === 0) return "Không có";
          if (hours < 24) return `${hours} giờ`;
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          if (remainingHours === 0) {
               return `${days} ngày`;
          }
          return `${days} ngày ${remainingHours} giờ`;
     };

     const containerVariants = {
          hidden: { opacity: 0 },
          visible: {
               opacity: 1,
               transition: {
                    staggerChildren: 0.2,
               },
          },
     };

     const itemVariants = {
          hidden: { y: 30, opacity: 0 },
          visible: {
               y: 0,
               opacity: 1,
               transition: {
                    duration: 0.6,
               },
          },
     };

     return (
          <ScrollReveal direction="up" delay={0.4} margin="70px 0px">
               <Container className=" py-5 max-h-[100vh] rounded-2xl shadow-lg from-blue-50 via-white to-indigo-50 border border-gray-200 bg-white">
                    <div className="max-w-7xl mx-auto">
                         <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6 }}
                              className="text-center mb-2"
                         >
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full mb-2">
                                   <Shield className="w-5 h-5 text-blue-600" />
                                   <span className="text-blue-600 font-semibold">Chính sách & Quy định</span>
                              </div>
                              <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-2">
                                   Chính sách hủy đặt sân
                              </h2>
                              <p className="text-lg text-teal-600 max-w-2xl mx-auto">
                                   Thông tin về chính sách hủy và phí hủy - Đảm bảo quyền lợi của bạn
                              </p>
                         </motion.div>

                         {loading ? (
                              <div className="text-center py-12">
                                   <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                   <p className="mt-4 text-gray-600">Đang tải chính sách...</p>
                              </div>
                         ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 mb-4">
                                   {/* Các card chính sách bên trái */}
                                   <div className="lg:col-span-3">
                                        <motion.div
                                             variants={containerVariants}
                                             initial="hidden"
                                             whileInView="visible"
                                             viewport={{ once: true }}
                                             className="grid grid-cols-1 gap-4"
                                        >
                                             {policies.map((policy) => (
                                                  <motion.div key={policy.id} variants={itemVariants}>
                                                       <Card className={`overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border h-full flex flex-col ${policy.isDefault ? 'border-orange-200' : 'border-blue-100'}`}>
                                                            <div className={`relative h-32 overflow-hidden ${policy.isDefault ? 'bg-gradient-to-br from-orange-500 to-amber-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'}`}>
                                                                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                                 {policy.isDefault && (
                                                                      <div className="absolute top-3 right-3">
                                                                           <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                                                                                Mặc định
                                                                           </span>
                                                                      </div>
                                                                 )}
                                                                 <div className="absolute bottom-3 left-4 right-4">
                                                                      <div className="flex items-center gap-2 mb-2">
                                                                           <Shield className="w-8 h-8 text-white" />
                                                                           <span className="text-xl font-bold text-white line-clamp-1">{policy.name}</span>
                                                                      </div>
                                                                 </div>
                                                            </div>

                                                            <div className="p-4 flex-1 flex flex-col">
                                                                 <p className="text-gray-700 text-base mb-4 line-clamp-2 flex-1">{policy.description}</p>

                                                                 {policy.isDefault ? (
                                                                      // Hiển thị thông tin tóm tắt cho chính sách mặc định
                                                                      <div className="space-y-3 mb-4">
                                                                           <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                                                                                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                                                                <div>
                                                                                     <div className="text-base font-semibold text-green-900">Hủy miễn phí</div>
                                                                                     <div className="text-sm text-green-700">
                                                                                          Trong vòng 2 giờ đầu
                                                                                     </div>
                                                                                </div>
                                                                           </div>

                                                                           <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                                                                                <Percent className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
                                                                                <div>
                                                                                     <div className="text-base font-semibold text-orange-900">Phí hủy</div>
                                                                                     <div className="text-sm text-orange-700">
                                                                                          Tăng dần theo thời gian
                                                                                     </div>
                                                                                </div>
                                                                           </div>

                                                                           <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                                                                                <Clock className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                                                                <div>
                                                                                     <div className="text-base font-semibold text-blue-900">Thời gian áp dụng</div>
                                                                                     <div className="text-sm text-blue-700">
                                                                                          Tính từ khi xác nhận đặt sân
                                                                                     </div>
                                                                                </div>
                                                                           </div>
                                                                      </div>
                                                                 ) : (
                                                                      // Hiển thị thông tin chính sách từ API
                                                                      <div className="space-y-3 mb-4">
                                                                           <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                                                                                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                                                                <div>
                                                                                     <div className="text-base font-semibold text-green-900">Hủy miễn phí</div>
                                                                                     <div className="text-sm text-green-700">
                                                                                          Trước {formatHours(policy.freeCancellationHours)}
                                                                                     </div>
                                                                                </div>
                                                                           </div>

                                                                           {policy.cancellationFeePercentage > 0 && (
                                                                                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                                                                                     <Percent className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
                                                                                     <div>
                                                                                          <div className="text-base font-semibold text-orange-900">Phí hủy</div>
                                                                                          <div className="text-sm text-orange-700">
                                                                                               {policy.cancellationFeePercentage}% giá trị đặt sân
                                                                                          </div>
                                                                                     </div>
                                                                                </div>
                                                                           )}

                                                                           <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                                                                                <Clock className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                                                                <div>
                                                                                     <div className="text-base font-semibold text-blue-900">Thời gian áp dụng</div>
                                                                                     <div className="text-sm text-blue-700">
                                                                                          Sau {formatHours(policy.freeCancellationHours)} trước giờ đặt
                                                                                     </div>
                                                                                </div>
                                                                           </div>
                                                                      </div>
                                                                 )}

                                                                 <Button
                                                                      onClick={() => navigate("/search")}
                                                                      className={`w-full rounded-2xl font-semibold ${policy.isDefault ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                                                                 >
                                                                      Xem chi tiết
                                                                      <ArrowRight className="w-4 h-4 ml-2" />
                                                                 </Button>
                                                            </div>
                                                       </Card>
                                                  </motion.div>
                                             ))}
                                        </motion.div>
                                   </div>

                                   {/* Tất cả chính sách bên phải */}
                                   <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6 }}
                                        className="lg:col-span-7 space-y-4"
                                   >
                                        {/* Bảng chính sách mặc định */}
                                        <Card className="bg-white rounded-2xl w-full h-full shadow-lg border border-orange-200 overflow-hidden">
                                             <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4">
                                                  <div className="flex items-center gap-2 mb-2">
                                                       <Shield className="w-7 h-7 text-white" />
                                                       <h3 className="text-xl font-bold text-white">Bảng chính sách hủy</h3>
                                                  </div>
                                                  <p className="text-sm text-white/90">Mức hoàn cọc và phạt theo thời gian</p>
                                             </div>
                                             <div className="p-4">
                                                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                       <table className="w-full text-sm">
                                                            <thead>
                                                                 <tr className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                                                                      <th className="px-4 py-3 text-left font-semibold">Thời gian</th>
                                                                      <th className="px-4 py-3 text-center font-semibold">Hoàn</th>
                                                                      <th className="px-4 py-3 text-center font-semibold">Phạt</th>
                                                                 </tr>
                                                            </thead>
                                                            <tbody>
                                                                 {defaultPolicy.ranges.map((range, idx) => (
                                                                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                                           <td className="px-4 py-3 text-gray-700 font-medium">{range.label}</td>
                                                                           <td className={`px-4 py-3 text-center font-semibold ${range.refundRate === 100 ? "text-green-600" : range.refundRate === 0 ? "text-red-600" : "text-blue-600"}`}>
                                                                                {range.refundRate}%
                                                                           </td>
                                                                           <td className={`px-4 py-3 text-center font-semibold ${range.penaltyRate === 0 ? "text-green-600" : range.penaltyRate === 100 ? "text-red-600" : "text-orange-600"}`}>
                                                                                {range.penaltyRate}%
                                                                           </td>
                                                                      </tr>
                                                                 ))}
                                                            </tbody>
                                                       </table>
                                                  </div>
                                                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                       <div className="flex items-start gap-2">
                                                            <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                                            <p className="text-sm text-orange-700">
                                                                 Thời gian tính từ khi chủ sân xác nhận đặt sân đến thời điểm bắt đầu booking.
                                                            </p>
                                                       </div>
                                                  </div>
                                             </div>
                                        </Card>

                                        {/* Tất cả các chính sách khác */}
                                        {allPolicies.length > 1 && (
                                             <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                                  {allPolicies.slice(1).map((policy) => (
                                                       <Card key={policy.id} className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
                                                            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-4">
                                                                 <div className="flex items-center gap-2 mb-1">
                                                                      <Shield className="w-6 h-6 text-white" />
                                                                      <h4 className="text-lg font-bold text-white line-clamp-1">{policy.name}</h4>
                                                                 </div>
                                                                 <p className="text-sm text-white/90 line-clamp-2">{policy.description}</p>
                                                            </div>
                                                            <div className="p-4 space-y-3">
                                                                 <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                                                                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                                                      <div>
                                                                           <div className="text-sm font-semibold text-green-900">Hủy miễn phí</div>
                                                                           <div className="text-sm text-green-700">
                                                                                Trước {formatHours(policy.freeCancellationHours)}
                                                                           </div>
                                                                      </div>
                                                                 </div>

                                                                 {policy.cancellationFeePercentage > 0 && (
                                                                      <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                                                                           <Percent className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                                                           <div>
                                                                                <div className="text-sm font-semibold text-orange-900">Phí hủy</div>
                                                                                <div className="text-sm text-orange-700">
                                                                                     {policy.cancellationFeePercentage}% giá trị đặt sân
                                                                                </div>
                                                                           </div>
                                                                      </div>
                                                                 )}

                                                                 <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                                                                      <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                                      <div>
                                                                           <div className="text-sm font-semibold text-blue-900">Thời gian áp dụng</div>
                                                                           <div className="text-sm text-blue-700">
                                                                                Sau {formatHours(policy.freeCancellationHours)} trước giờ đặt
                                                                           </div>
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       </Card>
                                                  ))}
                                             </div>
                                        )}
                                   </motion.div>
                              </div>
                         )}
                    </div>
               </Container>
          </ScrollReveal>
     );
};

