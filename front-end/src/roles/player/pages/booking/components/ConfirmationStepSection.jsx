import { CheckCircle } from "lucide-react";
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
               <p className="text-gray-600 mb-6">
                    {isRecurring
                         ? `Bạn đã đặt lịch cho ${recurringWeeks} tuần liên tiếp. Có thể xem chi tiết trong mục Lịch sử đặt sân.`
                         : "Bạn có thể xem chi tiết trong mục Lịch sử đặt sân."
                    }
               </p>
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

