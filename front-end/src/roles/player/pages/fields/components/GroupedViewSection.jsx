import { Link, useNavigate } from "react-router-dom";
import { MapPin, Star, User, EyeIcon, Heart } from "lucide-react";
import StadiumIcon from '@mui/icons-material/Stadium';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import { Button, SlideIn, StaggerContainer, FadeIn } from "../../../../../shared/components/ui";
import { getImageProps } from "../../../../../shared/utils/imageUtils";

export default function GroupedViewSection({
     title,
     icon: Icon,
     iconColor,
     bgColor,
     borderColor,
     items,
     type,
     handleBook,
     slotId,
     handleViewAll,
     user,
     handleLoginRequired,
     onToggleFavoriteField,
     onToggleFavoriteComplex,
     delay = 100
}) {
     // handleViewAll is passed as prop from parent
     const nav = useNavigate();

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
                                   <div
                                        className="group pt-3 px-3 border border-teal-100 bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1"
                                        onClick={() => {
                                             const targetUrl = type === 'complex' ? `/complex/${item.complexId}` : `/field/${item.fieldId}`;
                                             nav(targetUrl);
                                        }}
                                   >
                                        <div className="relative overflow-hidden">
                                             {type === 'complex' ? (
                                                  // Complex: use imageUrl as background
                                                  <div
                                                       className="w-full h-48 rounded-xl transition-transform duration-300 group-hover:scale-110 bg-cover bg-center"
                                                       style={{
                                                            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.3)), url(${item.imageUrl || 'https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg'})`,
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                       }}
                                                  />
                                             ) : (
                                                  // Field: use mainImageUrl
                                                  <img
                                                       {...getImageProps(
                                                            item.mainImageUrl || '',
                                                            item.name
                                                       )}
                                                       className="w-full h-48 object-cover rounded-xl transition-transform duration-300 group-hover:scale-110"
                                                       draggable={false}
                                                  />
                                             )}
                                             <div className={`absolute top-3 ${type === 'field' && (title === 'Giá tốt' || title === 'Đánh giá cao') ? 'left-3' : 'right-3'} flex items-center gap-2`}>
                                                  <Button
                                                       type="button"
                                                       onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                       onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (!user && handleLoginRequired) {
                                                                 handleLoginRequired('Bạn cần đăng nhập để sử dụng danh sách yêu thích.');
                                                                 return;
                                                            }
                                                            if (type === 'field' && onToggleFavoriteField) onToggleFavoriteField(item.fieldId);
                                                            if (type === 'complex' && onToggleFavoriteComplex) onToggleFavoriteComplex(item.complexId);
                                                       }}
                                                       className={`h-8 w-8 p-0 rounded-full shadow-sm transition-all duration-200 border hover:scale-110 hover:text-pink-600 ${item.isFavorite ? 'bg-teal-500 text-teal-50 border-teal-500' : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50'}`}
                                                  >
                                                       <Heart className="w-4 h-4" />
                                                  </Button>
                                             </div>
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
                                             <div className="flex bg-teal-50  border border-teal-100 px-2 py-1 rounded-full w-fit items-center text-teal-700 mb-2">
                                                  <MapPin className="w-4 h-4 mr-1" />
                                                  <span className="text-xs font-semibold line-clamp-1">{item.address}</span>
                                             </div>
                                             <div className="flex items-center justify-between mb-3">

                                                  <h3 className="text-base font-bold flex items-center text-teal-800 line-clamp-1">
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
                                                  <div className="flex item-center justify-between">
                                                       <div className="flex items-center justify-start gap-2 mb-4">
                                                            <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">
                                                                 {item.availableFields}/{item.totalFields} sân
                                                            </span>
                                                            <div className="text-xs font-semibold flex items-center text-red-500">
                                                                 <MapPin className="w-4 h-4 mr-1" />
                                                                 <p>{item.distanceKm ? `${item.distanceKm.toFixed(1)} km` : ""}</p>
                                                            </div>
                                                       </div>
                                                       <Button
                                                            type="button"
                                                            onMouseDown={(e) => {
                                                                 e.preventDefault();
                                                                 e.stopPropagation();
                                                            }}
                                                            onClick={(e) => {
                                                                 e.preventDefault();
                                                                 e.stopPropagation();
                                                                 if (!user && handleLoginRequired) {
                                                                      handleLoginRequired('Bạn cần đăng nhập để xem chi tiết. Vui lòng đăng nhập để tiếp tục.');
                                                                      return;
                                                                 }
                                                                 const targetUrl = type === 'complex' ? `/complex/${item.complexId}` : `/field/${item.fieldId}`;
                                                                 nav(targetUrl);
                                                            }}
                                                            className="w-fit hover:bg-teal-600 text-white px-3 py-0.5 rounded-full font-semibold transition-all duration-200 hover:scale-105"
                                                       >
                                                            <EyeIcon className="w-5 h-5" />
                                                       </Button>
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

                                                  {type === 'field' && (

                                                       <Button
                                                            type="button"
                                                            onMouseDown={(e) => {
                                                                 e.preventDefault();
                                                                 e.stopPropagation();
                                                            }}
                                                            onClick={(e) => {
                                                                 e.preventDefault();
                                                                 e.stopPropagation();
                                                                 handleBook(item.fieldId);
                                                                 nav(`/field/${item.fieldId}`)
                                                            }}

                                                            className="w-fit hover:scale-105 duration-200 bg-teal-500 hover:bg-teal-600 text-white px-2 py-1 rounded-full font-semibold transition-all flex items-center gap-2"
                                                       >
                                                            <EventSeatIcon className="w-2 h-2" />
                                                            Đặt sân
                                                       </Button>

                                                  )}
                                             </div>
                                        </div>
                                   </div>
                              </FadeIn>
                         ))}
                    </StaggerContainer>
               </div>
          </SlideIn >
     );
}

