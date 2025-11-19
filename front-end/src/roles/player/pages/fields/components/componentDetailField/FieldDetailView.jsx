import { ArrowLeft, User, CheckCircle, XCircle, Tag, Ruler, Leaf, MapPin, Heart } from "lucide-react";
import { Button } from "../../../../../../shared/components/ui";
import CancellationPolicyDisplay from "../../../../../../shared/components/CancellationPolicyDisplay";
import PromotionsDisplay from "../../../../../../shared/components/PromotionsDisplay";

export default function FieldDetailView({
     selectedField,
     complex,
     selectedSlotId,
     selectedFieldCheapestSlot,
     selectedFieldPriciestSlot,
     cancellationPolicy,
     promotions,
     fieldTypeMap = {},
     onBack,
     onQuickBook,
     onToggleFavoriteField
}) {
     if (!selectedField) {
          return (
               <div className="space-y-4">
                    <div>
                         <Button
                              type="button"
                              variant="outline"
                              className="border-teal-400/50 text-teal-700 hover:text-teal-800 rounded-2xl hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 hover:border-teal-400 shadow-sm transition-all"
                              onClick={onBack}
                         >
                              <ArrowLeft className="w-4 h-4 mr-1" />
                              <p className="text-xs hover:underline">Quay lại thông tin khu sân</p>
                         </Button>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                         <p className="text-yellow-800">Không tìm thấy thông tin sân. Vui lòng thử lại sau.</p>
                    </div>
               </div>
          );
     }

     const resolvedTypeName = (() => {
          if (!selectedField) return "";
          if (selectedField.typeName) return selectedField.typeName;
          const typeId = selectedField.typeId ?? selectedField.typeID ?? selectedField.TypeID ?? null;
          if (!typeId) return "";
          return fieldTypeMap[String(typeId)] || "";
     })();

     return (
          <div className="space-y-4">
               <div>
                    <Button
                         type="button"
                         variant="outline"
                         className="border-teal-400/50 text-teal-700 hover:text-teal-800 rounded-2xl hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 hover:border-teal-400 shadow-sm transition-all"
                         onClick={onBack}
                    >
                         <ArrowLeft className="w-4 h-4 mr-1" />
                         <p className="text-xs hover:underline">Quay lại thông tin khu sân</p>
                    </Button>
               </div>
               <div className="flex items-start gap-4">
                    {selectedField.image && (
                         <img
                              src={selectedField.image}
                              alt={selectedField.name}
                              className="w-28 h-28 object-cover rounded-xl border-2 border-teal-200 shadow-md"
                         />
                    )}
                    <div className="flex flex-row justify-between w-full">
                         <div>
                              <div className="text-xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">{selectedField.name}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                   {selectedField.typeName && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 border border-teal-200/50 shadow-sm">
                                             <User className="w-3 h-3" /> Loại: {resolvedTypeName || "—"}
                                        </span>
                                   )}

                                   <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${selectedSlotId ?
                                        (selectedField.isAvailableForSelectedSlot ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-300" : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-300") :
                                        "bg-gray-50 text-gray-600 border-gray-200"
                                        }`}>
                                        {selectedSlotId ?
                                             (selectedField.isAvailableForSelectedSlot ?
                                                  (<><CheckCircle className="w-3 h-3" /> Còn chỗ</>) :
                                                  (<><XCircle className="w-3 h-3" /> Hết chỗ</>)
                                             ) :
                                             "Chưa chọn slot"
                                        }
                                   </span>
                              </div>
                         </div>
                         <div className="flex items-start gap-2">
                              <Button
                                   type="button"
                                   onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (onToggleFavoriteField) onToggleFavoriteField(selectedField.fieldId);
                                   }}
                                   className={`h-9 w-9 p-0 rounded-full shadow-sm transition-all duration-200 border hover:scale-110 hover:text-pink-600 ${selectedField.isFavorite ? "bg-teal-500 text-teal-50 border-teal-500" : "bg-white text-teal-700 border-teal-200 hover:bg-teal-50"}`}
                              >
                                   <Heart className="w-4 h-4" />
                              </Button>
                              {selectedSlotId && (
                                   <div className="mt-2 text-sm text-gray-700 inline-flex items-center gap-1 bg-orange-50/50 px-3 py-1 rounded-lg border border-orange-200/50">
                                        <Tag className="w-4 h-4 text-orange-500" />
                                        Giá slot đã chọn: <b className="text-orange-600">{((selectedField.priceForSelectedSlot || 0).toLocaleString("vi-VN"))}₫</b>
                                   </div>
                              )}
                              {!selectedSlotId && (
                                   <div className="mt-2 text-sm text-gray-700 inline-flex items-center gap-1 bg-amber-50/50 px-3 py-1 rounded-lg border border-amber-200/50">
                                        <Tag className="w-4 h-4 text-amber-500" />
                                        Giá tham khảo: <b className="text-amber-600">{(selectedField.priceForSelectedSlot || 0) > 0 ? (selectedField.priceForSelectedSlot).toLocaleString("vi-VN") + "₫" : "Liên hệ"}</b>
                                   </div>
                              )}
                         </div>
                    </div>
               </div>
               <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/50 rounded-2xl p-5 shadow-md">
                    <div className="text-blue-700 text-lg text-center font-bold mb-2">Mô tả</div>
                    <div className="h-1 w-32 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 rounded-full mx-auto mb-3" />
                    <div className="text-gray-700 leading-relaxed">{selectedField.description || "Chưa có mô tả chi tiết về sân nhỏ."}</div>
               </div>
               <div className="bg-gradient-to-br from-white via-teal-50/30 to-white border border-teal-200/50 rounded-2xl p-5 shadow-md">
                    <div className="text-teal-700 text-lg text-center font-bold mb-2">Chi tiết</div>
                    <div className="h-1 w-32 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 rounded-full mx-auto mb-3" />
                    <div className="space-y-3 text-sm">
                         <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white/80 via-teal-50/40 to-white/80 hover:bg-gradient-to-r hover:from-teal-50/60 hover:via-emerald-50/40 hover:to-teal-50/60 transition-all border border-teal-200/30 hover:border-teal-300/50 shadow-sm">
                              <span className="inline-flex items-center gap-2 text-gray-700 font-medium">
                                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-sm">
                                        <User className="w-4 h-4 text-white" />
                                   </div>
                                   Loại sân
                              </span>
                              <b className="text-teal-700 font-bold">{resolvedTypeName || "—"}</b>
                         </div>
                         <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white/80 via-blue-50/40 to-white/80 hover:bg-gradient-to-r hover:from-blue-50/60 hover:via-indigo-50/40 hover:to-blue-50/60 transition-all border border-blue-200/30 hover:border-blue-300/50 shadow-sm">
                              <span className="inline-flex items-center gap-2 text-gray-700 font-medium">
                                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
                                        <Ruler className="w-4 h-4 text-white" />
                                   </div>
                                   Kích thước
                              </span>
                              <b className="text-blue-700 font-bold">{selectedField.size || "—"}</b>
                         </div>
                         <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white/80 via-emerald-50/40 to-white/80 hover:bg-gradient-to-r hover:from-emerald-50/60 hover:via-green-50/40 hover:to-emerald-50/60 transition-all border border-emerald-200/30 hover:border-emerald-300/50 shadow-sm">
                              <span className="inline-flex items-center gap-2 text-gray-700 font-medium">
                                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-sm">
                                        <Leaf className="w-4 h-4 text-white" />
                                   </div>
                                   Mặt cỏ
                              </span>
                              <b className="text-emerald-700 font-bold">{selectedField.grassType || "—"}</b>
                         </div>
                         <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white/80 via-teal-50/40 to-white/80 hover:bg-gradient-to-r hover:from-teal-50/60 hover:via-emerald-50/40 hover:to-teal-50/60 transition-all border border-teal-200/30 hover:border-teal-300/50 shadow-sm">
                              <span className="inline-flex items-center gap-2 text-gray-700 font-medium">
                                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-sm">
                                        <MapPin className="w-4 h-4 text-white" />
                                   </div>
                                   Thuộc khu sân
                              </span>
                              <b className="text-teal-700 font-bold">{complex?.name || "—"}</b>
                         </div>
                         <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-emerald-50/50 to-green-50/50 border border-emerald-200/50">
                              <span className="inline-flex items-center gap-2 text-gray-700 font-medium">
                                   <Tag className="w-4 h-4 text-emerald-600" /> Slot rẻ nhất
                              </span>
                              <b className="text-orange-600 font-bold">
                                   {(selectedFieldCheapestSlot?.price || 0).toLocaleString("vi-VN")}₫
                                   {selectedFieldCheapestSlot?.name ? ` • ${selectedFieldCheapestSlot.name}` : ""}
                              </b>
                         </div>
                         {selectedFieldPriciestSlot && (
                              <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-red-50/50 to-rose-50/50 border border-red-200/50">
                                   <span className="inline-flex items-center gap-2 text-gray-700 font-medium">
                                        <Tag className="w-4 h-4 text-red-600" /> Slot đắt nhất
                                   </span>
                                   <b className="text-orange-600 font-bold">
                                        {(selectedFieldPriciestSlot.price || 0).toLocaleString("vi-VN")}₫ • {selectedFieldPriciestSlot.name}
                                   </b>
                              </div>
                         )}
                    </div>
               </div>
               
               {/* Chính sách hủy */}
               <CancellationPolicyDisplay policy={cancellationPolicy} />
               
               {/* Khuyến mãi */}
               <PromotionsDisplay promotions={promotions} />
          </div>
     );
}

