import { Info, MapPin, Star, Clock, User, DollarSign, Tag, BadgeInfo } from "lucide-react";
import { FadeIn } from "../../../../../../shared/components/ui";
import FieldCardDetail from "./FieldCardDetail";

export default function ComplexInfoView({
     complex,
     fields,
     availableCount,
     cheapestSlot,
     priciestSlot,
     selectedSlotId,
     onFieldSelect,
     onQuickBookField
}) {
     return (
          <div className="grid grid-cols-1 gap-5">
               <img src={complex?.image} alt={complex?.name} className="w-full h-64 object-cover rounded-2xl" />

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
                                        Đánh giá: <b className="text-yellow-500">{complex?.rating || "Chưa có đánh giá"}</b> <p className="inline-block text-xs text-gray-500"> / 5</p>
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
                         <h3 className="text-2xl font-extrabold text-teal-800">Danh sách Sân nhỏ</h3>
                         <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {fields.map((f, index) => (
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
               </div>
          </div>
     );
}

