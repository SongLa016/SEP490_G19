import { Star, MessageSquare, Send, MoreHorizontal } from "lucide-react";
import { FadeIn, Button, Textarea, Popover, PopoverTrigger, PopoverContent } from "../../../../../../shared/components/ui";
import { useState } from "react";
import { createRatingReply, updateRatingReply, deleteRatingReply } from "../../../../../../shared/services/ratingReplies";
import { updateRating, deleteRating } from "../../../../../../shared/services/ratings";
import { getStoredToken, isTokenExpired } from "../../../../../../shared/utils/tokenManager";

export default function ReviewTabContent({
     reviewStats,
     complexReviews,
     reviewPage,
     reviewsPerPage,
     user,
     newRating,
     newComment,
     setNewRating,
     setNewComment,
     setReviewPage,
     onShowToast,
     onLoginPrompt,
     fieldId,
     isLoadingRatings,
     onRatingSubmit,
     canWriteReview = true
}) {
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [activeReplyRatingId, setActiveReplyRatingId] = useState(null);
     const [replyText, setReplyText] = useState("");
     const [editingReplyId, setEditingReplyId] = useState(null);
     const [editingReplyText, setEditingReplyText] = useState("");
     const [editingRatingId, setEditingRatingId] = useState(null);
     const [editingRatingStars, setEditingRatingStars] = useState(0);
     const [editingRatingComment, setEditingRatingComment] = useState("");
     const [isProcessingRating, setIsProcessingRating] = useState(false);

     const token = getStoredToken();
     const hasValidToken = !!token && !isTokenExpired(token);
     const currentUserId = user
          ? Number(
               user.userID ||
               user.UserID ||
               user.id ||
               user.Id ||
               user.userId
          )
          : null;
     return (
          <FadeIn delay={100}>
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center">
                         <h3 className="text-2xl font-extrabold text-teal-800">Đánh giá</h3>
                         <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 gap-5">
                         <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                   <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center">
                                             <span className="text-2xl font-extrabold text-teal-700">{reviewStats.average.toFixed(1)}</span>
                                        </div>
                                        <div>
                                             <div className="flex items-center">
                                                  {[...Array(5)].map((_, i) => (
                                                       <Star key={i} className={`w-5 h-5 ${i < Math.round(reviewStats.average) ? "text-yellow-400" : "text-gray-300"}`} />
                                                  ))}
                                             </div>
                                             <div className="text-sm text-gray-500">{reviewStats.total} đánh giá</div>
                                        </div>
                                   </div>
                                   <div className="w-full md:w-[420px] space-y-2">
                                        {[5, 4, 3, 2, 1].map(st => {
                                             const pct = reviewStats.total ? Math.round((reviewStats.counts[st] / reviewStats.total) * 100) : 0;
                                             return (
                                                  <div key={st} className="flex items-center gap-3">
                                                       <div className="flex items-center w-14 justify-end gap-1 text-gray-600">
                                                            <span className="font-semibold">{st}</span>
                                                            <Star className="w-4 h-4 text-yellow-400" />
                                                       </div>
                                                       <div className="flex-1 h-2 rounded-full bg-teal-50 overflow-hidden border border-teal-200">
                                                            <div className="h-full bg-teal-500" style={{ width: `${pct}%` }} />
                                                       </div>
                                                       <div className="w-16 text-right text-xs text-gray-500">{reviewStats.counts[st]} ({pct}%)</div>
                                                  </div>
                                             );
                                        })}
                                   </div>
                              </div>
                         </div>
                         <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                   <MessageSquare className="w-5 h-5 text-teal-600" />
                                   <h4 className="font-semibold text-teal-800">Viết đánh giá</h4>
                              </div>
                              {!canWriteReview ? (
                                   <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                                        Bạn không thể đánh giá nếu chưa đặt sân. Vui lòng vào mục
                                        <span className="font-semibold"> "Lịch sử đặt sân" </span>
                                        và đánh giá sau khi sân đã hoàn thành.
                                   </div>
                              ) : user ? (
                                   <>
                                        <div className="flex items-center gap-1 mb-3">
                                             {[...Array(5)].map((_, i) => (
                                                  <Button key={i} type="button" onClick={() => setNewRating(i + 1)} className="focus:outline-none p-0 h-auto bg-transparent border-0 hover:bg-transparent">
                                                       <Star className={`w-6 h-6 ${i < newRating ? "text-yellow-400" : "text-gray-300"}`} />
                                                  </Button>
                                             ))}
                                             <span className="ml-2 text-sm text-gray-600">{newRating ? `${newRating}/5` : "Chọn số sao"}</span>
                                        </div>
                                        <div className="relative">
                                             <Textarea
                                                  value={newComment}
                                                  onChange={(e) => setNewComment(e.target.value)}
                                                  placeholder="Chia sẻ trải nghiệm của bạn..."
                                                  className="min-h-[90px] border-teal-200 pr-28"
                                             />
                                             <Button
                                                  type="button"
                                                  onClick={async () => {
                                                       if (!fieldId) {
                                                            onShowToast("Vui lòng chọn sân để đánh giá.", 'warning');
                                                            return;
                                                       }
                                                       if (newRating === 0) {
                                                            onShowToast("Vui lòng chọn số sao đánh giá.", 'warning');
                                                            return;
                                                       }
                                                       if (!newComment.trim()) {
                                                            onShowToast("Vui lòng nhập nhận xét.", 'warning');
                                                            return;
                                                       }
                                                       setIsSubmitting(true);
                                                       try {
                                                            if (onRatingSubmit) {
                                                                 await onRatingSubmit({
                                                                      fieldId,
                                                                      stars: newRating,
                                                                      comment: newComment.trim()
                                                                 });
                                                            }
                                                            onShowToast("Cảm ơn bạn! Đánh giá của bạn sẽ được xử lý.", 'success');
                                                            setNewRating(0);
                                                            setNewComment("");
                                                       } catch (error) {
                                                            onShowToast(error.message || "Không thể gửi đánh giá.", 'error');
                                                       } finally {
                                                            setIsSubmitting(false);
                                                       }
                                                  }}
                                                  disabled={isSubmitting || !fieldId}
                                                  className="absolute right-2 bottom-2 inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                             >
                                                  {isSubmitting ? (
                                                       <>
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            Đang gửi...
                                                       </>
                                                  ) : (
                                                       <>
                                                            <Send className="w-4 h-4" /> Gửi đánh giá
                                                       </>
                                                  )}
                                             </Button>
                                        </div>
                                   </>
                              ) : (
                                   <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                        <p className="text-sm text-yellow-800 mb-3">Vui lòng đăng nhập để viết đánh giá.</p>
                                        <Button
                                             type="button"
                                             onClick={onLoginPrompt}
                                             className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg font-semibold"
                                        >
                                             Đăng nhập ngay
                                        </Button>
                                   </div>
                              )}
                         </div>
                         {isLoadingRatings ? (
                              <div className="text-center py-8">
                                   <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                                   <p className="mt-2 text-sm text-gray-600">Đang tải đánh giá...</p>
                              </div>
                         ) : reviewStats.total > 0 ? (
                              <div className="space-y-4">
                                   {complexReviews.slice((reviewPage - 1) * reviewsPerPage, reviewPage * reviewsPerPage).map((review, idx) => {
                                        // Điều kiện hiển thị nút "Trả lời" trong tab Đánh giá:
                                        // - Người dùng đã đăng nhập
                                        // - Token còn hạn
                                        // Việc kiểm soát "Hoàn Thành" đã được đảm bảo ở luồng BookingHistory khi ghi đánh giá
                                        const canReply = !!user && hasValidToken;
                                        const ratingKey = review.ratingId || review.id || idx;
                                        const isReplying = activeReplyRatingId === ratingKey;
                                        const isOwnRating =
                                             currentUserId !== null &&
                                             review.userId !== undefined &&
                                             Number(review.userId) === currentUserId;
                                        const canManageRating = isOwnRating && hasValidToken;
                                        const isEditingRating = editingRatingId === ratingKey;

                                        return (
                                             <div key={review.ratingId || review.id || idx} className="border border-teal-100 rounded-xl p-4 shadow-sm">
                                                  <div className="flex justify-between items-start mb-2">
                                                       <div>
                                                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                                 <span>{review.user || "Người dùng"}</span>
                                                                 {isOwnRating && hasValidToken && (
                                                                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                                                                           Bạn
                                                                      </span>
                                                                 )}
                                                            </h4>
                                                            {review.fieldName && (
                                                                 <div className="mt-0.5 inline-flex items-center text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-2 py-0.5">
                                                                      <span className="font-medium">Sân:</span>
                                                                      <span className="ml-1">{review.fieldName}</span>
                                                                 </div>
                                                            )}
                                                            <div className="flex items-center mt-1 gap-1">
                                                                 {[...Array(5)].map((_, i) => {
                                                                      const value = i + 1;
                                                                      const active = isEditingRating
                                                                           ? value <= (editingRatingStars || 0)
                                                                           : value <= (review.rating || 0);
                                                                      return (
                                                                           <button
                                                                                key={value}
                                                                                type="button"
                                                                                disabled={!isEditingRating}
                                                                                onClick={() => {
                                                                                     if (!isEditingRating) return;
                                                                                     setEditingRatingStars(value);
                                                                                }}
                                                                                className="disabled:cursor-default"
                                                                           >
                                                                                <Star
                                                                                     className={`w-4 h-4 ${active ? "text-yellow-400" : "text-gray-300"}`}
                                                                                />
                                                                           </button>
                                                                      );
                                                                 })}
                                                            </div>
                                                       </div>
                                                       <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-500">{review.date || ""}</span>
                                                            {canManageRating && !isEditingRating && (
                                                                 <Popover>
                                                                      <PopoverTrigger asChild>
                                                                           <button
                                                                                type="button"
                                                                                className="p-1 rounded-full hover:bg-teal-100 text-teal-700"
                                                                                aria-label="Tùy chọn đánh giá"
                                                                           >
                                                                                <MoreHorizontal className="w-4 h-4" />
                                                                           </button>
                                                                      </PopoverTrigger>
                                                                      <PopoverContent className="w-40 p-1 text-xs">
                                                                           <button
                                                                                type="button"
                                                                                className="w-full text-left px-2 py-1 rounded hover:bg-teal-50 text-teal-700"
                                                                                onClick={() => {
                                                                                     if (!hasValidToken || !currentUserId) {
                                                                                          onLoginPrompt?.();
                                                                                          return;
                                                                                     }
                                                                                     setEditingRatingId(ratingKey);
                                                                                     setEditingRatingStars(review.rating || 0);
                                                                                     setEditingRatingComment(review.comment || "");
                                                                                }}
                                                                           >
                                                                                Sửa đánh giá
                                                                           </button>
                                                                           <button
                                                                                type="button"
                                                                                className="w-full text-left px-2 py-1 rounded hover:bg-red-50 text-red-600"
                                                                                onClick={async () => {
                                                                                     if (!hasValidToken || !currentUserId) {
                                                                                          onLoginPrompt?.();
                                                                                          return;
                                                                                     }
                                                                                     if (!review.ratingId) return;
                                                                                     if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
                                                                                     try {
                                                                                          setIsProcessingRating(true);
                                                                                          await deleteRating(review.ratingId);
                                                                                          onShowToast?.("Đã xóa đánh giá.", "success");
                                                                                          window.location.reload();
                                                                                     } catch (error) {
                                                                                          console.error("Error deleting rating:", error);
                                                                                          onShowToast?.(
                                                                                               error.message || "Không thể xóa đánh giá.",
                                                                                               "error"
                                                                                          );
                                                                                     } finally {
                                                                                          setIsProcessingRating(false);
                                                                                     }
                                                                                }}
                                                                           >
                                                                                Xóa đánh giá
                                                                           </button>
                                                                      </PopoverContent>
                                                                 </Popover>
                                                            )}
                                                       </div>
                                                  </div>
                                                  {!isEditingRating ? (
                                                       <p className="text-gray-700">{review.comment || ""}</p>
                                                  ) : (
                                                       <div className="mt-2 space-y-2">
                                                            <Textarea
                                                                 value={editingRatingComment}
                                                                 onChange={(e) => setEditingRatingComment(e.target.value)}
                                                                 className="text-sm border-teal-200"
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                 <Button
                                                                      type="button"
                                                                      variant="outline"
                                                                      size="sm"
                                                                      className="px-3 py-1 text-xs rounded-full"
                                                                      onClick={() => {
                                                                           setEditingRatingId(null);
                                                                           setEditingRatingComment("");
                                                                           setEditingRatingStars(0);
                                                                      }}
                                                                 >
                                                                      Hủy
                                                                 </Button>
                                                                 <Button
                                                                      type="button"
                                                                      size="sm"
                                                                      disabled={isProcessingRating}
                                                                      className="px-3 py-1 text-xs rounded-full bg-teal-600 hover:bg-teal-700 text-white"
                                                                      onClick={async () => {
                                                                           if (!review.ratingId) return;
                                                                           if (!hasValidToken || !currentUserId) {
                                                                                onLoginPrompt?.();
                                                                                return;
                                                                           }
                                                                           try {
                                                                                setIsProcessingRating(true);
                                                                                await updateRating(review.ratingId, {
                                                                                     stars: editingRatingStars,
                                                                                     comment: editingRatingComment.trim(),
                                                                                });
                                                                                onShowToast?.("Đã cập nhật đánh giá.", "success");
                                                                                window.location.reload();
                                                                           } catch (error) {
                                                                                console.error("Error updating rating:", error);
                                                                                onShowToast?.(
                                                                                     error.message || "Không thể cập nhật đánh giá.",
                                                                                     "error"
                                                                                );
                                                                           } finally {
                                                                                setIsProcessingRating(false);
                                                                           }
                                                                      }}
                                                                 >
                                                                      Lưu
                                                                 </Button>
                                                            </div>
                                                       </div>
                                                  )}

                                                  {/* Hiển thị các trả lời (replies) nếu có */}
                                                  {Array.isArray(review.replies) && review.replies.length > 0 && (
                                                       <div className="mt-3 space-y-2 pl-3 border-l-2 border-teal-100">
                                                            {review.replies.map((reply, rIdx) => {
                                                                 const key = reply.replyId || rIdx;
                                                                 const canManageReply =
                                                                      !!user &&
                                                                      hasValidToken &&
                                                                      currentUserId !== null &&
                                                                      Number(reply.userId) === currentUserId;
                                                                 const isEditing = editingReplyId === key;

                                                                 return (
                                                                      <div key={key} className="text-sm text-gray-700 bg-teal-50/60 rounded-lg px-3 py-2">
                                                                           <div className="flex items-center justify-between mb-1">
                                                                                <span className="font-semibold text-teal-800">{reply.userName || "Chủ sân"}</span>
                                                                                <div className="flex items-center gap-2">
                                                                                     {reply.createdAt && (
                                                                                          <span className="text-xs text-gray-500">
                                                                                               {new Date(reply.createdAt).toLocaleDateString("vi-VN")}
                                                                                          </span>
                                                                                     )}
                                                                                     {canManageReply && !isEditing && (
                                                                                          <Popover>
                                                                                               <PopoverTrigger asChild>
                                                                                                    <button
                                                                                                         type="button"
                                                                                                         className="p-1 rounded-full hover:bg-teal-100 text-teal-700"
                                                                                                         aria-label="Tùy chọn trả lời"
                                                                                                    >
                                                                                                         <MoreHorizontal className="w-4 h-4" />
                                                                                                    </button>
                                                                                               </PopoverTrigger>
                                                                                               <PopoverContent className="w-32 p-1 text-xs">
                                                                                                    <button
                                                                                                         type="button"
                                                                                                         className="w-full text-left px-2 py-1 rounded hover:bg-teal-50 text-teal-700"
                                                                                                         onClick={() => {
                                                                                                              setEditingReplyId(key);
                                                                                                              setEditingReplyText(reply.replyText || "");
                                                                                                         }}
                                                                                                    >
                                                                                                         Sửa
                                                                                                    </button>
                                                                                                    <button
                                                                                                         type="button"
                                                                                                         className="w-full text-left px-2 py-1 rounded hover:bg-red-50 text-red-600"
                                                                                                         onClick={async () => {
                                                                                                              if (!reply.replyId) return;
                                                                                                              if (!hasValidToken || !currentUserId) {
                                                                                                                   onLoginPrompt?.();
                                                                                                                   return;
                                                                                                              }
                                                                                                              try {
                                                                                                                   setIsSubmitting(true);
                                                                                                                   await deleteRatingReply(reply.replyId);
                                                                                                                   onShowToast?.("Đã xóa trả lời.", "success");
                                                                                                              } catch (error) {
                                                                                                                   console.error("Error deleting rating reply:", error);
                                                                                                                   onShowToast?.(
                                                                                                                        error.message || "Không thể xóa trả lời.",
                                                                                                                        "error"
                                                                                                                   );
                                                                                                              } finally {
                                                                                                                   setIsSubmitting(false);
                                                                                                              }
                                                                                                         }}
                                                                                                    >
                                                                                                         Xóa
                                                                                                    </button>
                                                                                               </PopoverContent>
                                                                                          </Popover>
                                                                                     )}
                                                                                </div>
                                                                           </div>
                                                                           {!isEditing ? (
                                                                                <p className="text-sm text-gray-700">{reply.replyText || ""}</p>
                                                                           ) : (
                                                                                <div className="space-y-2 mt-1">
                                                                                     <Textarea
                                                                                          value={editingReplyText}
                                                                                          onChange={(e) => setEditingReplyText(e.target.value)}
                                                                                          className="text-sm border-teal-200"
                                                                                     />
                                                                                     <div className="flex gap-2 justify-end">
                                                                                          <Button
                                                                                               type="button"
                                                                                               variant="outline"
                                                                                               size="sm"
                                                                                               className="px-3 py-1 text-xs rounded-full"
                                                                                               onClick={() => {
                                                                                                    setEditingReplyId(null);
                                                                                                    setEditingReplyText("");
                                                                                               }}
                                                                                          >
                                                                                               Hủy
                                                                                          </Button>
                                                                                          <Button
                                                                                               type="button"
                                                                                               size="sm"
                                                                                               disabled={isSubmitting || !editingReplyText.trim()}
                                                                                               className="px-3 py-1 text-xs rounded-full bg-teal-600 hover:bg-teal-700 text-white"
                                                                                               onClick={async () => {
                                                                                                    if (!reply.replyId || !editingReplyText.trim()) return;
                                                                                                    if (!hasValidToken || !currentUserId) {
                                                                                                         onLoginPrompt?.();
                                                                                                         return;
                                                                                                    }
                                                                                                    try {
                                                                                                         setIsSubmitting(true);
                                                                                                         await updateRatingReply(reply.replyId, editingReplyText.trim());
                                                                                                         onShowToast?.("Đã cập nhật trả lời.", "success");
                                                                                                         setEditingReplyId(null);
                                                                                                         setEditingReplyText("");
                                                                                                    } catch (error) {
                                                                                                         console.error("Error updating rating reply:", error);
                                                                                                         onShowToast?.(
                                                                                                              error.message || "Không thể cập nhật trả lời.",
                                                                                                              "error"
                                                                                                         );
                                                                                                    } finally {
                                                                                                         setIsSubmitting(false);
                                                                                                    }
                                                                                               }}
                                                                                          >
                                                                                               Lưu
                                                                                          </Button>
                                                                                     </div>
                                                                                </div>
                                                                           )}
                                                                      </div>
                                                                 );
                                                            })}
                                                       </div>
                                                  )}

                                                  {canReply && (
                                                       <div className="mt-3 space-y-2">
                                                            {!isReplying ? (
                                                                 <Button
                                                                      type="button"
                                                                      variant="outline"
                                                                      size="sm"
                                                                      className="text-xs px-2 py-1 rounded-full border-teal-300 text-teal-700"
                                                                      onClick={() => {
                                                                           setActiveReplyRatingId(ratingKey);
                                                                           setReplyText("");
                                                                      }}
                                                                 >
                                                                      Trả lời
                                                                 </Button>
                                                            ) : (
                                                                 <div className="space-y-2">
                                                                      <Textarea
                                                                           value={replyText}
                                                                           onChange={(e) => setReplyText(e.target.value)}
                                                                           placeholder="Nhập nội dung trả lời..."
                                                                           className="text-sm border-teal-200"
                                                                      />
                                                                      <div className="flex gap-2 justify-end">
                                                                           <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="px-3 py-1 text-xs rounded-full"
                                                                                onClick={() => {
                                                                                     setActiveReplyRatingId(null);
                                                                                     setReplyText("");
                                                                                }}
                                                                           >
                                                                                Hủy
                                                                           </Button>
                                                                           <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                disabled={isSubmitting || !replyText.trim()}
                                                                                className="px-3 py-1 text-xs rounded-full bg-teal-600 hover:bg-teal-700 text-white"
                                                                                onClick={async () => {
                                                                                     if (!replyText.trim()) return;
                                                                                     if (!hasValidToken || !currentUserId) {
                                                                                          onLoginPrompt?.();
                                                                                          return;
                                                                                     }
                                                                                     try {
                                                                                          setIsSubmitting(true);
                                                                                          const userId =
                                                                                               user?.userID ||
                                                                                               user?.UserID ||
                                                                                               user?.id ||
                                                                                               user?.Id ||
                                                                                               user?.userId;
                                                                                          await createRatingReply({
                                                                                               userId,
                                                                                               ratingId: review.ratingId || review.id,
                                                                                               replyText: replyText.trim(),
                                                                                          });
                                                                                          onShowToast?.("Đã gửi trả lời đánh giá.", "success");
                                                                                          setActiveReplyRatingId(null);
                                                                                          setReplyText("");
                                                                                     } catch (error) {
                                                                                          console.error("Error creating rating reply:", error);
                                                                                          onShowToast?.(
                                                                                               error.message || "Không thể gửi trả lời.",
                                                                                               "error"
                                                                                          );
                                                                                     } finally {
                                                                                          setIsSubmitting(false);
                                                                                     }
                                                                                }}
                                                                           >
                                                                                Gửi trả lời
                                                                           </Button>
                                                                      </div>
                                                                 </div>
                                                            )}
                                                       </div>
                                                  )}
                                             </div>
                                        );
                                   })}
                                   {reviewStats.total > reviewsPerPage && (
                                        <div className="flex items-center justify-center gap-2">
                                             <Button
                                                  type="button"
                                                  variant="outline"
                                                  className="px-3 py-1 rounded-full border-teal-200 text-teal-700"
                                                  disabled={reviewPage === 1}
                                                  onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                                             >
                                                  Trước
                                             </Button>
                                             <div className="text-sm text-gray-600">Trang {reviewPage}/{Math.ceil(reviewStats.total / reviewsPerPage)}</div>
                                             <Button
                                                  type="button"
                                                  variant="outline"
                                                  className="px-3 py-1 rounded-full border-teal-200 text-teal-700"
                                                  disabled={reviewPage === Math.ceil(reviewStats.total / reviewsPerPage)}
                                                  onClick={() => setReviewPage(p => Math.min(Math.ceil(reviewStats.total / reviewsPerPage), p + 1))}
                                             >
                                                  Sau
                                             </Button>
                                        </div>
                                   )}
                              </div>
                         ) : (
                              <div className="text-center py-8 text-gray-500">
                                   <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                   <p className="text-sm">Chưa có đánh giá nào cho sân này.</p>
                              </div>
                         )}
                    </div>
               </div>
          </FadeIn>
     );
}

