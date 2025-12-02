import { useState, useEffect } from "react";
import { Info, MapPin, Star, Clock, User, DollarSign, Tag, BadgeInfo, ChevronLeft, ChevronRight } from "lucide-react";
import { FadeIn } from "../../../../../../shared/components/ui";
import FieldCardDetail from "./FieldCardDetail";

export default function ComplexInfoView({
     complex,
     fields,
     availableCount,
     cheapestSlot,
     priciestSlot,
     selectedSlotId,
     reviewStats,
     onFieldSelect,
     onQuickBookField
}) {
     // Lấy ảnh từ imageUrl (Cloudinary) hoặc fallback về image/imageBase64
     const complexImageUrl = complex?.imageUrl || complex?.image || complex?.imageBase64 || null;

     // Phân trang: 4 card mỗi trang
     const ITEMS_PER_PAGE = 4;
     const [currentPage, setCurrentPage] = useState(1);

     // Tính toán số trang
     const totalPages = Math.ceil(fields.length / ITEMS_PER_PAGE);

     // Lấy các field cho trang hiện tại
     const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
     const endIndex = startIndex + ITEMS_PER_PAGE;
     const currentFields = fields.slice(startIndex, endIndex);

     // Reset về trang 1 khi fields thay đổi
     useEffect(() => {
          setCurrentPage(1);
     }, [fields.length]);

     const handlePreviousPage = () => {
          setCurrentPage(prev => Math.max(1, prev - 1));
     };

     const handleNextPage = () => {
          setCurrentPage(prev => Math.min(totalPages, prev + 1));
     };

     const handlePageClick = (page) => {
          setCurrentPage(page);
     };

     const ratingSummary = (() => {
          const total = reviewStats?.total ?? 0;
          const average = total > 0 ? Number(reviewStats?.average || 0) : null;
          if (average === null) {
               return {
                    displayValue: "Chưa có đánh giá",
                    total: 0
               };
          }
          return {
               displayValue: `${average.toFixed(1)} / 5`,
               total
          };
     })();

     return (
          <div className="grid grid-cols-1 gap-5">
               {complexImageUrl ? (
                    <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-lg">
                         <img
                              src={complexImageUrl}
                              alt={complex?.name || "Khu sân"}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              onError={(e) => {
                                   // Fallback nếu ảnh không tải được
                                   e.target.src = 'https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg';
                              }}
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                    </div>
               ) : (
                    <div className="w-full h-64 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 border-2 border-dashed border-teal-300 flex items-center justify-center">
                         <div className="text-center">
                              <MapPin className="w-16 h-16 text-teal-400 mx-auto mb-2 opacity-50" />
                              <p className="text-teal-600 font-medium">Chưa có ảnh khu sân</p>
                         </div>
                    </div>
               )}

               {/* Thông tin chi tiết */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-teal-50 via-emerald-50/50 to-teal-50 border border-teal-200/50 rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow">
                         <div className="mb-3">
                              <div className="text-teal-700 text-base text-center uppercase flex items-center justify-center font-bold">
                                   <Info className="w-5 h-5 mr-1 text-teal-600" /> <p className="inline-block">Thông tin cơ bản</p>
                              </div>
                              <div className="h-1 w-32 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 rounded-full mx-auto mt-1" />
                         </div>
                         <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                   <MapPin className="w-4 h-4 text-teal-600" />
                                   <span className="text-gray-700 text-sm font-medium">{complex?.address}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                   <Star className="w-4 h-4 text-yellow-500" />
                                   <span className="text-gray-700 font-medium">
                                        Đánh giá:{" "}
                                        <b className="text-yellow-500">
                                             {ratingSummary.displayValue}
                                        </b>
                                        {ratingSummary.total > 0 && (
                                             <span className="inline-block text-xs text-gray-500 ml-1">
                                                  ({ratingSummary.total} đánh giá)
                                             </span>
                                        )}
                                   </span>
                              </div>
                              <div className="flex items-center gap-2">
                                   <Clock className="w-4 h-4 text-teal-600" />
                                   <span className="text-gray-700 font-medium">Tổng số sân: <b className="text-teal-600">{fields.length}</b></span>
                              </div>
                              <div className="flex items-center gap-2">
                                   <User className="w-4 h-4 text-teal-600" />
                                   <span className="text-gray-700 font-medium">Sân còn trống: <b className="text-teal-600">{availableCount}</b></span>
                              </div>
                         </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-200/50 rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow">
                         <div className="mb-3">
                              <div className="text-blue-700 text-base text-center uppercase flex items-center justify-center font-bold">
                                   <DollarSign className="w-5 h-5 text-blue-600" /> <p className="inline-block">Giá cả</p>
                              </div>
                              <div className="h-1 w-32 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 rounded-full mx-auto mt-1" />
                         </div>
                         <div className="space-y-3">
                              <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                                   <span className="text-gray-700 font-medium inline-flex items-center gap-1">
                                        <Tag className="w-4 h-4 text-emerald-600" />Slot rẻ nhất:
                                   </span>
                                   <span className="text-orange-600 font-bold text-sm">
                                        {(cheapestSlot?.price || 0).toLocaleString("vi-VN")}₫ <p className="inline-block text-xs text-gray-500">/ trận{cheapestSlot?.name ? ` • ${cheapestSlot.name}` : ""}</p>
                                   </span>
                              </div>
                              {priciestSlot && (
                                   <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                                        <span className="text-gray-700 font-medium inline-flex items-center gap-1">
                                             <Tag className="w-4 h-4 text-red-600" />Slot đắt nhất:
                                        </span>
                                        <span className="text-orange-600 font-bold text-sm">
                                             {(priciestSlot.price || 0).toLocaleString("vi-VN")}₫ <p className="inline-block text-xs text-gray-500">/ trận • {priciestSlot.name}</p>
                                        </span>
                                   </div>
                              )}
                         </div>
                    </div>
               </div>

               <div className="bg-gradient-to-br from-gray-50 via-slate-50 to-gray-50 border border-teal-200/50 rounded-2xl p-4 shadow-md">
                    <div className="text-teal-700 text-base text-center uppercase flex items-center justify-center font-bold mb-2">
                         <BadgeInfo className="w-5 h-5 mr-1 text-teal-600" /> <p className="inline-block">Mô tả</p>
                    </div>
                    <div className="h-1 w-32 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 rounded-full mx-auto mb-3" />
                    <div className="text-gray-700 leading-relaxed">{complex?.description || "Chưa có mô tả chi tiết về khu sân."}</div>
               </div>

               {/* Danh sách Sân nhỏ */}
               <div className="space-y-4">
                    <div className="text-center">
                         <h3 className="text-2xl font-extrabold text-teal-800">Danh sách sân nhỏ</h3>
                         <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                    </div>

                    {currentFields.length > 0 ? (
                         <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   {currentFields.map((f, index) => (
                                        <FadeIn key={f.fieldId} delay={index * 50}>
                                             <FieldCardDetail
                                                  field={f}
                                                  selectedSlotId={selectedSlotId}
                                                  onViewDetail={() => onFieldSelect(f.fieldId)}
                                                  onQuickBook={() => onQuickBookField(f.fieldId)}
                                             />
                                        </FadeIn>
                                   ))}
                              </div>

                              {/* Phân trang */}
                              {totalPages > 1 && (
                                   <div className="flex items-center justify-between">
                                        {fields.length > 0 && (
                                             <p className="text-sm text-gray-600 mt-2">
                                                  Hiển thị {startIndex + 1}-{Math.min(endIndex, fields.length)} trong tổng số {fields.length} sân
                                             </p>
                                        )}

                                        <div className="flex items-center justify-center gap-2">
                                             <button
                                                  onClick={handlePreviousPage}
                                                  disabled={currentPage === 1}
                                                  className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all ${currentPage === 1
                                                       ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                                                       : "bg-white border-teal-300 text-teal-600 hover:bg-teal-50 hover:border-teal-400 shadow-sm"
                                                       }`}
                                             >
                                                  <ChevronLeft className="w-5 h-5" />
                                             </button>

                                             <div className="flex items-center gap-1">
                                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                       // Hiển thị tối đa 5 số trang
                                                       if (totalPages <= 7) {
                                                            return (
                                                                 <button
                                                                      key={page}
                                                                      onClick={() => handlePageClick(page)}
                                                                      className={`w-7 h-7 rounded-full border transition-all font-semibold ${currentPage === page
                                                                           ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-teal-500 shadow-md"
                                                                           : "bg-white border-teal-300 text-teal-600 hover:bg-teal-50 hover:border-teal-400 shadow-sm"
                                                                           }`}
                                                                 >
                                                                      {page}
                                                                 </button>
                                                            );
                                                       } else {
                                                            // Logic hiển thị trang với ellipsis
                                                            if (
                                                                 page === 1 ||
                                                                 page === totalPages ||
                                                                 (page >= currentPage - 1 && page <= currentPage + 1)
                                                            ) {
                                                                 return (
                                                                      <button
                                                                           key={page}
                                                                           onClick={() => handlePageClick(page)}
                                                                           className={`w-7 h-7 rounded-full border transition-all font-semibold ${currentPage === page
                                                                                ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-teal-500 shadow-md"
                                                                                : "bg-white border-teal-300 text-teal-600 hover:bg-teal-50 hover:border-teal-400 shadow-sm"
                                                                                }`}
                                                                      >
                                                                           {page}
                                                                      </button>
                                                                 );
                                                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                                 return (
                                                                      <span key={page} className="px-2 text-gray-400">
                                                                           ...
                                                                      </span>
                                                                 );
                                                            }
                                                            return null;
                                                       }
                                                  })}
                                             </div>

                                             <button
                                                  onClick={handleNextPage}
                                                  disabled={currentPage === totalPages}
                                                  className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all ${currentPage === totalPages
                                                       ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                                                       : "bg-white border-teal-300 text-teal-600 hover:bg-teal-50 hover:border-teal-400 shadow-sm"
                                                       }`}
                                             >
                                                  <ChevronRight className="w-5 h-5" />
                                             </button>
                                        </div>
                                   </div>
                              )}
                         </>
                    ) : (
                         <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-teal-50/30 rounded-2xl border border-teal-200/50">
                              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                              <p className="text-gray-500 font-medium">Chưa có sân nhỏ nào</p>
                         </div>
                    )}
               </div>
          </div>
     );
}

