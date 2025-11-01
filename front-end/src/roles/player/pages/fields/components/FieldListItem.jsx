import { MapPin, Star, Heart, Clock } from "lucide-react";
import StadiumIcon from '@mui/icons-material/Stadium';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import { Button, FadeIn } from "../../../../../shared/components/ui";

export default function FieldListItem({ field, index, slotId, formatPrice, handleToggleFavorite, handleBook, navigate }) {
     return (
          <FadeIn key={field.fieldId} delay={index * 50}>
               <div
                    key={field.fieldId}
                    onClick={(e) => { e.preventDefault(); navigate(`/field/${field.fieldId}`); }}
                    className="bg-white px-5 py-4 rounded-3xl shadow-lg overflow-hidden hover:scale-[1.01] duration-300 transition-all border border-teal-100 hover:border-teal-200 cursor-pointer"
               >
                    <div className="flex">
                         <div className="w-96 h-52 flex-shrink-0">
                              <img
                                   src={field.image}
                                   alt={field.name}
                                   className="w-full h-full rounded-2xl object-cover transition-transform duration-300 hover:scale-105"
                                   draggable={false}
                              />
                         </div>
                         <div className="flex-1 px-4 py-1">
                              <div className="flex justify-between items-start">
                                   <div className="flex bg-teal-50 border border-teal-100 px-2 py-1 rounded-full w-fit items-center text-teal-700 mb-1">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        <span className="text-xs font-semibold">{field.address}  <a
                                             href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(field.address || "")}`}
                                             target="_blank"
                                             rel="noreferrer"
                                             className="ml-2 text-teal-600 underline"
                                        >
                                             Xem bản đồ
                                        </a></span>
                                   </div>
                                   <Button
                                        onClick={(e) => {
                                             e.stopPropagation();
                                             handleToggleFavorite(field.id);
                                        }}
                                        className={`px-3 rounded-full transition-all duration-200 hover:scale-110 ${field.isFavorite ? "bg-red-500 text-white hover:bg-red-600" : "bg-teal-100 text-teal-700 hover:border-red-100 hover:border hover:text-red-600 hover:bg-red-50"}`}
                                   >
                                        <Heart className="w-4 h-4" />
                                   </Button>
                              </div>
                              <div className="flex items-center justify-between mb-5">
                                   <div className="flex-1 items-center">
                                        <h3 className="text-2xl font-bold text-teal-800 px-2 flex items-center">
                                             <StadiumIcon className="w-6 h-6 mr-2 text-teal-500" />
                                             {field.name}
                                        </h3>
                                        <div className="flex items-center">
                                             <Star className="w-4 h-4 text-teal-400 mr-1" />
                                             <span className="text-sm font-semibold">{field.rating}</span>
                                             <span className="text-sm text-gray-500 ml-1">({field.reviewCount} đánh giá)</span>
                                        </div>
                                   </div>
                                   <div className="text-xl font-bold text-teal-600 flex items-center">
                                        <AttachMoneyIcon className="w-5 h-5 mr-1" />
                                        {formatPrice(field.priceForSelectedSlot || 0)}/trận
                                   </div>
                              </div>

                              <div className="flex flex-wrap gap-2 mb-5">
                                   {(field.amenities || []).map((amenity, index) => (
                                        <span
                                             key={index}
                                             className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full text-xs border border-teal-200"
                                        >
                                             {amenity}
                                        </span>
                                   ))}
                              </div>
                              <div className="flex justify-between items-center">
                                   <div className="text-sm items-center flex text-gray-500">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        <p> {slotId ? (field.isAvailableForSelectedSlot ? "Còn chỗ" : "Hết chỗ") : field.typeName} • {field.distanceKm ? `${Number(field.distanceKm).toFixed(1)} km` : ""} </p>
                                   </div>
                                   <div className="flex space-x-2">
                                        <Button
                                             type="button"
                                             onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleBook(field.fieldId);
                                             }}
                                             className="bg-teal-500 hover:bg-teal-600 text-white py-1 px-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105 flex items-center gap-2"
                                        >
                                             <EventSeatIcon className="w-4 h-4" />
                                             Đặt sân
                                        </Button>
                                   </div>
                              </div>
                         </div>
                    </div>
               </div>
          </FadeIn>
     );
}

