import { MapPin, User, EyeIcon } from "lucide-react";
import { Card, CardContent, Button } from "../../../../../../shared/components/ui";
import { LocalOfferOutlined, StadiumOutlined } from "@mui/icons-material";

export default function FieldCardDetail({ field, selectedSlotId, onViewDetail, onQuickBook }) {
     return (
          <Card className="border border-teal-200/50 rounded-xl overflow-hidden shadow-md bg-white group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:ring-2 hover:ring-teal-300/50 hover:scale-[1.02] hover:-translate-y-1 h-full">
               <CardContent className="p-0">
                    <div className="relative overflow-hidden" onClick={onViewDetail}>
                         <img
                              src={field.mainImageUrl || 'https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg'}
                              alt={field.name}
                              className="w-full h-48 object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                              loading="lazy"
                              onError={(e) => {
                                   e.target.src = 'https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg';
                              }}
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute top-3 right-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg border border-teal-400/30">
                              <User className="w-4 h-4" />
                              {field.typeName}
                         </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col bg-gradient-to-b from-white to-teal-50/20">
                         <div className="flex items-center gap-1 mb-3">
                              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/50 px-2 py-1 rounded-full text-xs text-teal-700 font-medium flex items-center gap-1 shadow-sm">
                                   <MapPin className="w-3 h-3 text-teal-600" />
                                   <span className="line-clamp-1">{field.address}</span>
                              </div>
                         </div>
                         <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-bold flex items-center gap-1 bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent flex-1">
                                   <StadiumOutlined className="w-4 h-4 text-teal-600" />{field.name}
                              </h3>
                              <div className="text-base font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent flex items-center">
                                   <LocalOfferOutlined className="w-3 h-3 text-orange-600 mr-1" />
                                   {selectedSlotId ?
                                        (field.priceForSelectedSlot ? field.priceForSelectedSlot.toLocaleString("vi-VN") + "₫" : "Liên hệ") :
                                        (field.priceForSelectedSlot ? field.priceForSelectedSlot.toLocaleString("vi-VN") + "₫" : "Liên hệ")
                                   } /trận
                              </div>
                         </div>

                         <div className="flex items-center gap-2 justify-end">
                              <Button
                                   type="button"
                                   variant="outline"
                                   className="border-teal-400/50 text-teal-700 rounded-xl px-3 py-1.5 hover:text-teal-800 hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 hover:border-teal-400 shadow-sm transition-all"
                                   onClick={(e) => { e.stopPropagation(); onViewDetail(); }}
                                   title="Xem chi tiết"
                              >
                                   <EyeIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                   type="button"
                                   onClick={(e) => { e.stopPropagation(); onQuickBook(); }}
                                   disabled={selectedSlotId && !field.isAvailableForSelectedSlot}
                                   className={`${selectedSlotId && !field.isAvailableForSelectedSlot ? "bg-gray-300 px-3 py-1.5 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-teal-500 to-emerald-500 px-3 py-1.5 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl"} rounded-xl font-semibold transition-all`}
                              >
                                   {selectedSlotId && !field.isAvailableForSelectedSlot ? "Hết chỗ" : "Đặt sân"}
                              </Button>
                         </div>
                    </div>
               </CardContent>
          </Card>
     );
}

