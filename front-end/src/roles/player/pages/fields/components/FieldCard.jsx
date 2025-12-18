import { MapPin, Star, Heart } from "lucide-react";
import StadiumIcon from '@mui/icons-material/Stadium';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import { Button, FadeIn } from "../../../../../shared/components/ui";
import { getImageProps } from "../../../../../shared/utils/imageUtils";

export default function FieldCard({ field, index, activeTab, slotId, formatPrice, handleToggleFavorite, handleBook, navigate }) {
     return (
          <FadeIn key={field.fieldId} delay={index * 50}>
               <div
                    onClick={(e) => {
                         // nếu click vào phần tử có data-stop-propagation thì không điều hướng
                         const blocker = (e.target instanceof Element) ? e.target.closest('[data-stop-propagation="true"]') : null;
                         if (blocker || e.defaultPrevented) {
                              return;
                         }
                         navigate(`/field/${field.fieldId}`);
                    }} className="group bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 hover:ring-1 hover:ring-teal-100 h-full flex flex-col cursor-pointer"
               >
                    <div className="relative overflow-hidden">
                         <img
                              {...getImageProps(
                                   field.mainImageUrl || '',
                                   field.name
                              )}
                              className="w-full h-40 md:h-44 object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                              draggable={false}
                         />
                         <div className="absolute top-4 right-4 flex space-x-2">
                              <Button
                                   type="button"
                                   data-stop-propagation="true"
                                   onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                   }}
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavorite(field.fieldId);
                                   }}
                                   variant="outline"
                                   className={`h-8 w-8 p-0 rounded-full shadow-sm transition-all duration-200 border hover:scale-110 hover:text-pink-600 ${field.isFavorite ? "bg-teal-500 text-teal-50 border-teal-500" : "bg-white text-teal-700 border-teal-200 hover:bg-teal-50"}`}
                              >
                                   <Heart className="w-4 h-4" />
                              </Button>
                              <div className="bg-white/95 backdrop-blur px-2 py-1 rounded-full text-sm font-semibold text-teal-600 border border-teal-200 shadow-sm">
                                   {slotId ? (field.isAvailableForSelectedSlot ? "Còn chỗ" : "Hết chỗ") : field.typeName}
                              </div>
                         </div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                         <h3 className="text-lg font-semibold text-teal-800 mb-2 flex items-center">
                              <StadiumIcon className="w-5 h-5 mr-2 text-teal-500 flex-shrink-0" />
                              <span className="truncate">{field.name}</span>
                         </h3>
                         <div className="flex bg-teal-50 border border-teal-100 p-1 rounded-full w-fit items-center text-teal-700 mb-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="text-xs line-clamp-1">{field.address}</span>
                         </div>
                         <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                   {activeTab === "near" ? (
                                        field.distanceKm !== undefined && field.distanceKm !== null ? (
                                             <>
                                                  <div className="flex items-center justify-between">
                                                       <div className="flex items-center">
                                                            <MapPin className="w-4 h-4 text-red-500 mr-1" />
                                                            <span className="text-sm font-bold text-red-600">
                                                                 {Number(field.distanceKm).toFixed(1)}km
                                                            </span>
                                                       </div>
                                                       <div className="text-sm ml-20 font-semibold text-orange-600 bg-orange-50 px-2 gap-1 rounded-full w-fit items-center">
                                                            {formatPrice(field.priceForSelectedSlot || 0)}/trận
                                                       </div>
                                                  </div>
                                             </>
                                        ) : (
                                             <>
                                                  <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                                                  <span className="text-sm text-gray-500">
                                                       Chưa có vị trí
                                                  </span>
                                             </>
                                        )
                                   ) : activeTab === "best-price" ? (
                                        <span className="text-sm font-semibold truncate text-red-600 bg-red-50 px-2 py-1 rounded-full">Giá tốt nhất</span>
                                   ) : activeTab === "top-rated" ? (
                                        <>
                                             <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                             <span className="text-sm font-semibold text-yellow-600">{field.rating}</span>
                                             <span className="text-sm text-red-500 ml-1">({field.reviewCount})</span>
                                             <div className="text-sm ml-24 font-semibold text-orange-600 bg-orange-50 px-2 gap-1 rounded-full w-fit items-center">
                                                  {formatPrice(field.priceForSelectedSlot || 0)}/trận
                                             </div>
                                        </>
                                   ) : (
                                        <>
                                             <Star className="w-4 h-4 text-teal-400 mr-1" />
                                             <span className="text-sm font-semibold">{field.rating}</span>
                                             <span className="text-sm text-gray-500 ml-1">({field.reviewCount})</span>
                                             <div className="text-sm ml-24 font-semibold text-orange-600 bg-orange-50 px-2 gap-1 rounded-full w-fit items-center">
                                                  {formatPrice(field.priceForSelectedSlot || 0)}/trận
                                             </div>
                                        </>
                                   )}
                              </div>
                              {activeTab === "best-price" && (
                                   <div className="text-sm font-semibold text-red-600 bg-red-50 px-2 gap-1 rounded-full w-fit items-center">
                                        <AttachMoneyIcon className="w-2 h-2" />
                                        {formatPrice(field.priceForSelectedSlot || 0)}/trận
                                   </div>
                              )}

                         </div>
                         <div className="flex items-center gap-2 mb-4">
                              {Array.isArray(field.amenities) && field.amenities.length > 0 && (
                                   <>
                                        <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full text-xs border border-teal-200">{field.amenities[0]}</span>
                                        {field.amenities.length > 1 && (
                                             <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full text-xs border border-teal-200">+{field.amenities.length - 1}</span>
                                        )}
                                   </>
                              )}
                         </div>
                         <div className="mt-auto">
                              <Button
                                   type="button"
                                   data-stop-propagation="true"
                                   onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                   }}
                                   onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleBook(field.fieldId);
                                        navigate(`/field/${field.fieldId}`)
                                   }}

                                   className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                              >
                                   <EventSeatIcon className="w-4 h-4" />
                                   Đặt sân
                              </Button>
                         </div>
                    </div>
               </div>
          </FadeIn>
     );
}
