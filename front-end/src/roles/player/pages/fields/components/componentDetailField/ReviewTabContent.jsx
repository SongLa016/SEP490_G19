import { Star, MessageSquare, Send } from "lucide-react";
import { FadeIn, Button, Textarea } from "../../../../../../shared/components/ui";

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
     onLoginPrompt
}) {
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
                              {user ? (
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
                                                  onClick={() => {
                                                       onShowToast("Cảm ơn bạn! Đánh giá của bạn sẽ được xử lý.", 'success');
                                                       setNewRating(0);
                                                       setNewComment("");
                                                  }}
                                                  className="absolute right-2 bottom-2 inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white text-sm px-3 py-1.5 rounded-lg"
                                             >
                                                  <Send className="w-4 h-4" /> Gửi đánh giá
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
                         {reviewStats.total > 0 && (
                              <div className="space-y-4">
                                   {complexReviews.slice((reviewPage - 1) * reviewsPerPage, reviewPage * reviewsPerPage).map((review, idx) => (
                                        <div key={idx} className="border border-teal-100 rounded-xl p-4 shadow-sm">
                                             <div className="flex justify-between items-start mb-2">
                                                  <div>
                                                       <h4 className="font-semibold text-gray-900">{review.user || "Người dùng"}</h4>
                                                       <div className="flex items-center mt-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                 <Star key={i} className={`w-4 h-4 ${i < (review.rating || 0) ? "text-yellow-400" : "text-gray-300"}`} />
                                                            ))}
                                                       </div>
                                                  </div>
                                                  <span className="text-sm text-gray-500">{review.date || ""}</span>
                                             </div>
                                             <p className="text-gray-700">{review.comment || ""}</p>
                                        </div>
                                   ))}
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
                         )}
                    </div>
               </div>
          </FadeIn>
     );
}

