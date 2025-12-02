import { MapPin, Star, Heart, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StadiumIcon from '@mui/icons-material/Stadium';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import { Button, FadeIn } from "../../../../../shared/components/ui";

export default function FieldListItem({ field, index, slotId, formatPrice, handleToggleFavorite, handleBook, user, handleLoginRequired }) {
     const navigate = useNavigate();
     return (
          <FadeIn key={field.fieldId} delay={index * 50}>
               <div
                    onClick={(e) => {
                         const blocker = (e.target instanceof Element) ? e.target.closest('[data-stop-propagation="true"]') : null;
                         if (blocker || e.defaultPrevented) {
                              return;
                         }
                         navigate(`/field/${field.fieldId}`);
                    }}
                    className="bg-white px-5 py-4 rounded-3xl shadow-lg overflow-hidden hover:scale-[1.01] duration-300 transition-all border border-teal-100 hover:border-teal-200 cursor-pointer"
               >
                    <div className="flex flex-col md:flex-row gap-3">
                         <div className="w-full md:w-80 lg:w-96 h-48 md:h-52 flex-shrink-0">
                              <img
                                   src={field.mainImageUrl || 'https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg'}
                                   alt={field.name}
                                   className="w-full h-full rounded-2xl object-cover transition-transform duration-300 hover:scale-105"
                                   draggable={false}
                                   onError={(e) => {
                                        e.target.src = 'https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg';
                                   }}
                              />
                         </div>
                         <div className="flex-1 md:px-4 py-3">
                              <div className="flex justify-between items-start gap-2 flex-wrap">
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
                                        data-stop-propagation="true"
                                        onClick={(e) => {
                                             e.stopPropagation();
                                             handleToggleFavorite(field.fieldId);
                                        }}
                                        className={`px-3 rounded-full transition-all duration-200 hover:scale-110 ${field.isFavorite ? "bg-teal-500 text-white hover:bg-teal-600" : "bg-teal-100 text-teal-700 hover:border-pink-100 hover:border hover:text-pink-600 hover:bg-pink-50"}`}
                                   >
                                        <Heart className="w-4 h-4" />
                                   </Button>
                              </div>
                              <div className="flex items-center justify-between mb-4">
                                   <div className="flex-1 items-center">
                                        <h3 className="text-xl md:text-2xl font-bold text-teal-800 px-2 flex items-center">
                                             <StadiumIcon className="w-5 h-5 md:w-6 md:h-6 mr-2 text-teal-500" />
                                             {field.name}
                                        </h3>
                                        <div className="flex items-center">
                                             <Star className="w-4 h-4 text-teal-400 mr-1" />
                                             <span className="text-sm font-semibold">{field.rating}</span>
                                             <span className="text-sm text-gray-500 ml-1">({field.reviewCount} đánh giá)</span>
                                        </div>
                                   </div>
                                   <div className="text-lg md:text-xl font-bold text-orange-600 flex items-center whitespace-nowrap">
                                        <AttachMoneyIcon className="w-4 h-4 md:w-5 md:h-5 mr-1" />
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
                              <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                                   <div className="text-sm items-center flex text-gray-500">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        <p> {slotId ? (field.isAvailableForSelectedSlot ? "Còn chỗ" : "Hết chỗ") : field.typeName} • {field.distanceKm ? `${Number(field.distanceKm).toFixed(1)} km` : ""} </p>
                                   </div>
                                   <div className="flex space-x-2 w-full md:w-auto">
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
                                                  navigate(`/field/${field.fieldId}`);
                                             }}
                                             className="bg-teal-500 hover:bg-teal-600 text-white py-2 md:py-1 px-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105 flex items-center gap-2 w-full md:w-auto justify-center"
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
