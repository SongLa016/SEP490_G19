import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "../../../../../shared/components/ui";

export default function ConfirmationStepSection({
     isRecurring,
     recurringWeeks,
     hasOpponent,
     createdMatchRequest,
     createdCommunityPost,
     onClose,
     onSuccess,
     navigate
}) {
     return (
          <div className="text-center py-8">
               <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
               <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {isRecurring ? `Đặt lịch ${recurringWeeks} tuần thành công!` : "Đặt sân thành công!"}
               </h3>
               <p className="text-gray-600 mb-4">
                    {isRecurring
                         ? `Bạn đã đặt lịch cho ${recurringWeeks} tuần liên tiếp. Có thể xem chi tiết trong mục Lịch sử đặt sân.`
                         : "Bạn có thể xem chi tiết trong mục Lịch sử đặt sân."
                    }
               </p>
               
               {/* Thông báo về trạng thái chờ xác nhận */}
               <div className="mb-6 mx-auto max-w-md bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                    <div className="flex items-start gap-3">
                         <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                         <div>
                              <h4 className="font-semibold text-yellow-800 mb-1">Đang chờ chủ sân xác nhận</h4>
                              <p className="text-sm text-yellow-700 leading-relaxed">
                                   Booking của bạn đang ở trạng thái <strong>"Chờ xác nhận"</strong>. 
                                   Chủ sân sẽ xem xét và xác nhận booking trong thời gian sớm nhất. 
                                   Bạn sẽ nhận được thông báo khi booking được xác nhận.
                              </p>
                              <p className="text-xs text-yellow-600 mt-2">
                                   💡 Bạn có thể theo dõi trạng thái booking trong mục <strong>"Lịch sử đặt sân"</strong>
                              </p>
                         </div>
                    </div>
               </div>
               {false && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-800">
                         <div className="font-semibold mb-1">Đã tạo yêu cầu tìm đối</div>
                         <div className="text-sm">
                              {createdMatchRequest ? `Mã yêu cầu: ${createdMatchRequest.requestId}` : "Yêu cầu đã được mở."}
                         </div>
                         <div className="text-sm">
                              {createdCommunityPost ? `Đã đăng bài trong Cộng đồng: ${createdCommunityPost.postId}` : "Đang đăng bài trong Cộng đồng..."}
                         </div>
                    </div>
               )}
               <div className="flex gap-4 justify-center">
                    <Button
                         onClick={() => {
                              onClose();
                              onSuccess?.();
                         }}
                         className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                         Đóng
                    </Button>
                    <Button
                         onClick={() => {
                              onClose();
                              if (navigate) {
                                   if (false && createdCommunityPost) {
                                        navigate("/community", { state: { highlightPostId: createdCommunityPost.postId, tab: "find-match" } });
                                   } else {
                                        navigate("/bookings");
                                   }
                              }
                         }}
                         variant="outline"
                         className="px-6 py-3 rounded-lg"
                    >
                         {hasOpponent === "no" ? "Xem bài tìm đối" : "Xem lịch sử đặt sân"}
                    </Button>
               </div>
          </div>
     );
}

