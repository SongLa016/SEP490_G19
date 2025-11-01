import { Link } from "react-router-dom";
import { MapPin, Star, User, EyeIcon } from "lucide-react";
import StadiumIcon from '@mui/icons-material/Stadium';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import { Button, SlideIn, StaggerContainer, FadeIn } from "../../../../../shared/components/ui";

export default function GroupedViewSection({
     title,
     icon: Icon,
     iconColor,
     bgColor,
     borderColor,
     items,
     type, // 'complex' or 'field'
     navigate,
     formatPrice,
     handleBook,
     slotId,
     handleViewAll,
     delay = 100
}) {
     // handleViewAll is passed as prop from parent

     return (
          <SlideIn direction="up" delay={delay}>
               <div>
                    <div className="flex items-center justify-between mb-4">
                         <h2 className={`text-lg font-extrabold ${iconColor} tracking-tight`}>
                              <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border ${borderColor} ${bgColor}`}>
                                   <Icon className="w-5 h-5" />
                                   <span>{title}</span>
                              </span>
                         </h2>
                         <Button
                              type="button"
                              onClick={handleViewAll}
                              className="px-3 py-1 rounded-2xl hover:border-b-2 bg-transparent hover:bg-teal-50 text-teal-600 hover:text-teal-700 hover:border-teal-300 text-sm transition-all duration-200"
                         >
                              Xem tất cả
                         </Button>
                    </div>
                    <StaggerContainer staggerDelay={50} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
                         {items.map((item, index) => (
                              <FadeIn key={type === 'complex' ? item.complexId : item.fieldId} delay={index * 50}>
                                   <Link
                                        key={type === 'complex' ? item.complexId : item.fieldId}
                                        to={type === 'complex' ? `/complex/${item.complexId}` : `/field/${item.fieldId}`}
                                        className="group pt-3 px-3 border border-teal-100 bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1"
                                   >
                                        <div className="relative overflow-hidden">
                                             <img
                                                  src={item.image}
                                                  alt={item.name}
                                                  className="w-full h-48 object-cover rounded-xl transition-transform duration-300 group-hover:scale-110"
                                                  draggable={false}
                                             />
                                             {type === 'field' && (
                                                  <div className="absolute top-4 right-4 flex space-x-2">
                                                       <div className="bg-white/95 backdrop-blur-md border border-teal-100 px-2 py-1 rounded-full text-xs font-semibold text-teal-600 shadow-sm flex items-center gap-1">
                                                            <User size={16} />
                                                            <p>{slotId ? (item.isAvailableForSelectedSlot ? "Còn chỗ" : "Hết chỗ") : item.typeName}</p>
                                                       </div>
                                                  </div>
                                             )}
                                        </div>
                                        <div className="px-2 py-3 flex-1 flex flex-col">
                                             <div className="flex bg-teal-50 border border-teal-100 px-2 py-1 rounded-full w-fit items-center text-teal-700 mb-2">
                                                  <MapPin className="w-4 h-4 mr-1" />
                                                  <span className="text-xs font-semibold line-clamp-1">{item.address}</span>
                                             </div>
                                             <div className="flex items-center justify-between mb-3">

                                                  <h3 className="text-lg font-bold flex items-center text-teal-800 line-clamp-1">
                                                       <StadiumIcon className="w-2 h-2 mr-1 text-teal-500 fill-teal-500" />
                                                       {item.name}</h3>
                                                  {type === 'field' && title === 'Giá tốt' && (
                                                       <div className="flex items-center">
                                                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Giá tốt nhất</span>
                                                       </div>
                                                  )}
                                                  {type === 'field' && title === 'Đánh giá cao' && (
                                                       <div className="flex items-center">
                                                            <Star className="w-4 h-4 text-red-500 mr-1" />
                                                            <span className="text-sm font-bold text-red-600">{item.rating}</span>
                                                            <span className="text-sm text-red-500 ml-1">({item.reviewCount})</span>
                                                       </div>
                                                  )}
                                             </div>
                                             {type === 'complex' && (
                                                  <div className="flex items-center justify-between gap-2 mb-4">
                                                       <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">
                                                            {item.availableFields}/{item.totalFields} sân
                                                       </span>
                                                       <div className="text-xs flex items-center text-gray-500">
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            <p>{item.distanceKm ? `${item.distanceKm.toFixed(1)} km` : ""}</p>
                                                       </div>
                                                  </div>
                                             )}
                                             {type === 'field' && (
                                                  <div className="flex items-center gap-2 mb-4">
                                                       {Array.isArray(item.amenities) && item.amenities.length > 0 && (
                                                            <>
                                                                 <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">{item.amenities[0]}</span>
                                                                 {item.amenities.length > 1 && (
                                                                      <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">+{item.amenities.length - 1}</span>
                                                                 )}
                                                            </>
                                                       )}
                                                  </div>
                                             )}
                                             <div className="mt-auto flex items-center justify-between">
                                                  <div className="text-sm font-bold text-orange-600 flex items-center">
                                                       <AttachMoneyIcon className="w-1 h-1" />
                                                       {formatPrice(type === 'complex' ? item.minPriceForSelectedSlot || 0 : item.priceForSelectedSlot || 0)}/trận
                                                  </div>
                                                  {type === 'field' ? (
                                                       <Button
                                                            type="button"
                                                            onClick={(e) => {
                                                                 e.stopPropagation();
                                                                 handleBook(item.fieldId);
                                                            }}
                                                            className="w-fit hover:scale-105 duration-200 bg-teal-500 hover:bg-teal-600 text-white px-2 py-1 rounded-full font-semibold transition-all flex items-center gap-2"
                                                       >
                                                            <EventSeatIcon className="w-2 h-2" />
                                                            Đặt sân
                                                       </Button>
                                                  ) : (
                                                       <Link

                                                            to={type === 'complex' ? `/complex/${item.complexId}` : `/field/${item.fieldId}`}
                                                       >
                                                            <div className="w-fit bg-teal-500 hover:bg-teal-600 text-white px-3 py-0.5 rounded-full font-semibold transition-all duration-200 hover:scale-105">
                                                                 <EyeIcon className="w-5 h-5" />
                                                            </div>
                                                       </Link>
                                                  )}
                                             </div>
                                        </div>
                                   </Link>
                              </FadeIn>
                         ))}
                    </StaggerContainer>
               </div>
          </SlideIn>
     );
}

