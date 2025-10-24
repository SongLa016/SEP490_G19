import { useState } from "react";
import { Users, Calendar, Clock, CheckCircle, X } from "lucide-react";
import { Button, Modal } from "./ui/index";
import { createMatchRequest, createCommunityPost } from "../utils/communityStore";

export default function RecurringOpponentModal({
     isOpen,
     onClose,
     booking,
     user,
     level,
     note,
     onSuccess
}) {
     const [selectedOption, setSelectedOption] = useState("all");
     const [isProcessing, setIsProcessing] = useState(false);

     const handleConfirm = async () => {
          setIsProcessing(true);
          try {
               // Get all bookings in the recurring group
               const { listBookingsByUser } = await import("../utils/bookingStore");
               const allBookings = listBookingsByUser(user?.id || "");
               const recurringBookings = allBookings.filter(b =>
                    b.isRecurring && b.recurringGroupId === booking.recurringGroupId
               );

               const baseData = {
                    ownerId: user?.id,
                    level,
                    note: note.trim(),
                    fieldName: booking.fieldName,
                    address: booking.fieldAddress || booking.address || "",
                    price: booking.price || 0,
                    createdByName: user?.name || "Người dùng",
                    isRecurring: true,
                    recurringSessions: recurringBookings.map(b => ({
                         bookingId: b.id,
                         date: b.date,
                         slotName: b.slotName || b.time || ""
                    })),
                    recurringType: selectedOption
               };

               if (selectedOption === "individual") {
                    // Create individual requests for each session
                    const requests = createMatchRequest(baseData);
                    // Handle the response (could be single request or array)
                    if (Array.isArray(requests)) {
                         // Multiple requests created
                    } else {
                         // Single request created
                    }
               } else {
                    // Create single request for all sessions or first session
                    const requestNote = selectedOption === "all"
                         ? `${note} - Tất cả ${recurringBookings.length} buổi`
                         : `${note} - Buổi đầu tiên`;

                    createMatchRequest({
                         ...baseData,
                         note: requestNote,
                         date: recurringBookings[0]?.date || booking.date,
                         slotName: recurringBookings[0]?.slotName || booking.slotName || booking.time || ""
                    });
                    // Request created successfully
               }

               // Create community post
               createCommunityPost({
                    userId: user?.id,
                    content: `Tìm đối cho lịch cố định ${booking.fieldName} - ${recurringBookings.length} buổi`,
                    location: booking.fieldAddress || booking.address || "",
                    time: `${recurringBookings[0]?.date || booking.date} ${recurringBookings[0]?.slotName || booking.slotName || booking.time || ""}`,
                    authorName: user?.name || "Người dùng",
                    bookingId: booking.id,
                    fieldName: booking.fieldName,
                    date: booking.date,
                    slotName: booking.slotName || booking.time || ""
               });

               onSuccess();
          } catch (error) {
               console.error("Error creating recurring opponent requests:", error);
          } finally {
               setIsProcessing(false);
          }
     };

     if (!isOpen || !booking) return null;

     const options = [
          {
               id: "all",
               title: "Tìm đối cho tất cả buổi",
               description: "Tìm một đối thủ cho cả chuỗi lịch cố định",
               icon: Users,
               pros: ["Đảm bảo có đối cho tất cả buổi", "Dễ quản lý"],
               cons: ["Đối thủ phải cam kết cho cả chuỗi", "Ít linh hoạt"]
          },
          {
               id: "individual",
               title: "Tìm đối cho từng buổi",
               description: "Tạo yêu cầu tìm đối riêng lẻ cho mỗi buổi",
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
               isOpen={isOpen}
               onClose={onClose}
               title="Tìm đối thủ cho lịch cố định"
               className="max-w-2xl rounded-2xl"
          >
               <div className="px-3">
                    {/* Description */}
                    <div className="mb-6">
                         <p className="text-gray-600">
                              Chọn cách tìm đối thủ cho lịch cố định của bạn:
                         </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-4 mb-6">
                         {options.map((option) => {
                              const Icon = option.icon;
                              const isSelected = selectedOption === option.id;

                              return (
                                   <div
                                        key={option.id}
                                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${isSelected
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
                                                  <div className="flex items-center gap-2 mb-1">
                                                       <h4 className="font-medium text-gray-900">
                                                            {option.title}
                                                       </h4>
                                                       {isSelected && (
                                                            <CheckCircle className="w-4 h-4 text-teal-600" />
                                                       )}
                                                  </div>
                                                  <p className="text-sm text-gray-600 mb-3">
                                                       {option.description}
                                                  </p>

                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                       <div>
                                                            <div className="font-medium text-green-700 mb-1">Ưu điểm:</div>
                                                            <ul className="space-y-1">
                                                                 {option.pros.map((pro, idx) => (
                                                                      <li key={idx} className="text-green-600">• {pro}</li>
                                                                 ))}
                                                            </ul>
                                                       </div>
                                                       <div>
                                                            <div className="font-medium text-orange-700 mb-1">Nhược điểm:</div>
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

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                         <Button
                              onClick={onClose}
                              variant="outline"
                              disabled={isProcessing}
                              className="flex items-center gap-2"
                         >
                              <X className="w-4 h-4" />
                              Hủy
                         </Button>
                         <Button
                              onClick={handleConfirm}
                              disabled={isProcessing}
                              className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
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
