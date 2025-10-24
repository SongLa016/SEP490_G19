import { useState } from "react";
import { Users, Calendar, Clock, CheckCircle, X } from "lucide-react";
import { Button, Modal } from "../components/ui";

export default function RecurringOpponentSelection({
     isRecurring,
     recurringSessions,
     onOpponentSelection,
     onClose
}) {
     const [selectedOption, setSelectedOption] = useState("all");
     const [isProcessing, setIsProcessing] = useState(false);

     const handleConfirm = async () => {
          setIsProcessing(true);
          try {
               await onOpponentSelection(selectedOption, recurringSessions);
               onClose();
          } catch (error) {
               console.error("Error creating opponent requests:", error);
          } finally {
               setIsProcessing(false);
          }
     };

     if (!isRecurring || !recurringSessions || recurringSessions.length === 0) {
          return null;
     }

     const options = [
          {
               id: "all",
               title: "Tìm đối cho tất cả buổi",
               description: `Tìm một đối thủ cho cả ${recurringSessions.length} buổi đặt sân`,
               icon: Users,
               pros: ["Đảm bảo có đối cho tất cả buổi", "Dễ quản lý"],
               cons: ["Đối thủ phải cam kết cho cả chuỗi", "Ít linh hoạt"]
          },
          {
               id: "individual",
               title: "Tìm đối cho từng buổi",
               description: `Tạo ${recurringSessions.length} yêu cầu tìm đối riêng lẻ`,
               icon: Calendar,
               pros: ["Linh hoạt cao", "Có thể có đối khác nhau"],
               cons: ["Có thể không tìm được đối cho một số buổi", "Phức tạp quản lý"]
          },
          {
               id: "first",
               title: "Tìm đối cho buổi đầu tiên",
               description: "Chỉ tìm đối cho buổi đầu, các buổi sau sẽ tìm sau",
               icon: Clock,
               pros: ["Đơn giản", "Có thể đánh giá đối thủ trước"],
               cons: ["Các buổi sau có thể không có đối"]
          }
     ];

     return (
          <Modal
               isOpen={true}
               onClose={onClose}
               title="Tìm đối thủ cho lịch cố định"
               className="max-w-2xl rounded-2xl overflow-y-auto max-h-[80vh] scrollbar-hide"
          >
               <div className="px-3">
                    {/* Description */}
                    <div className="mb-2">
                         <p className="text-base text-gray-700 font-semibold">
                              Bạn đã đặt {recurringSessions.length} buổi sân. Chọn cách tìm đối thủ:
                         </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 mb-3">
                         {options.map((option) => {
                              const Icon = option.icon;
                              const isSelected = selectedOption === option.id;

                              return (
                                   <div
                                        key={option.id}
                                        className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${isSelected
                                             ? "border-teal-500 bg-teal-50"
                                             : "border-gray-200 hover:border-gray-300"
                                             }`}
                                        onClick={() => setSelectedOption(option.id)}
                                   >
                                        <div className="flex items-start gap-3">
                                             <div className={`p-2 rounded-lg ${isSelected ? "bg-teal-100" : "bg-gray-100"
                                                  }`}>
                                                  <Icon className={`w-5 h-5 ${isSelected ? "text-teal-600" : "text-gray-600"
                                                       }`} />
                                             </div>
                                             <div className="flex-1">
                                                  <div className="flex items-center gap-2">
                                                       <h4 className="font-medium text-gray-900">
                                                            {option.title}
                                                       </h4>
                                                       {isSelected && (
                                                            <CheckCircle className="w-4 h-4 text-teal-600" />
                                                       )}
                                                  </div>
                                                  <p className="text-sm text-gray-600 mb-2">
                                                       {option.description}
                                                  </p>

                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                       <div>
                                                            <div className="font-medium text-green-700">Ưu điểm:</div>
                                                            <ul className="space-y-1">
                                                                 {option.pros.map((pro, idx) => (
                                                                      <li key={idx} className="text-green-600">• {pro}</li>
                                                                 ))}
                                                            </ul>
                                                       </div>
                                                       <div>
                                                            <div className="font-medium text-orange-700">Nhược điểm:</div>
                                                            <ul className="space-y-1">
                                                                 {option.cons.map((con, idx) => (
                                                                      <li key={idx} className="text-orange-600">• {con}</li>
                                                                 ))}
                                                            </ul>
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              );
                         })}
                    </div>

                    {/* Preview of sessions */}
                    <div className="mb-3">
                         <h4 className="font-medium text-gray-900 mb-3">
                              Danh sách buổi đặt sân ({recurringSessions.length} buổi):
                         </h4>
                         <div className="max-h-40 overflow-y-auto space-y-2">
                              {recurringSessions.slice(0, 5).map((session, idx) => (
                                   <div key={idx} className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-xl border border-blue-200">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                             {session.date?.toLocaleDateString("vi-VN")} - {session.slotName}
                                        </span>
                                   </div>
                              ))}
                              {recurringSessions.length > 5 && (
                                   <div className="text-sm text-gray-500 text-center py-2">
                                        ... và {recurringSessions.length - 5} buổi khác
                                   </div>
                              )}
                         </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">

                         <Button
                              onClick={handleConfirm}
                              disabled={isProcessing}
                              className="bg-teal-600 hover:bg-teal-700 rounded-2xl flex items-center gap-2"
                         >
                              {isProcessing ? (
                                   <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Đang xử lý...</span>
                                   </div>
                              ) : (
                                   <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Xác nhận</span>
                                   </div>
                              )}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}
