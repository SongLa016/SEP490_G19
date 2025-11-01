import { Link } from "react-router-dom";
import { MapPin, EyeIcon } from "lucide-react";
import StadiumIcon from '@mui/icons-material/Stadium';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { Button, FadeIn } from "../../../../../shared/components/ui";

export default function ComplexListItem({ complex, index, navigate, formatPrice }) {
     return (
          <FadeIn key={complex.complexId} delay={index * 50}>
               <Link
                    key={complex.complexId}
                    to={`/complex/${complex.complexId}`}
                    onClick={(e) => { e.preventDefault(); navigate(`/complex/${complex.complexId}`); }}
                    className="bg-white px-5 py-4 rounded-3xl shadow-lg overflow-hidden border border-teal-100 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
               >
                    <div className="flex">
                         <div className="w-96 h-52 flex-shrink-0">
                              <img src={complex.image} alt={complex.name} className="w-full h-full rounded-2xl object-cover transition-transform duration-300 hover:scale-105" draggable={false} />
                         </div>
                         <div className="flex-1 px-4 py-1">
                              <div className="flex justify-between items-start">
                                   <div className="flex bg-teal-50 border border-teal-100 px-2 py-1 rounded-full w-fit items-center text-teal-700 mb-1">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        <span className="text-xs font-semibold">{complex.address}</span>
                                   </div>
                              </div>
                              <div className="flex items-center justify-between mb-3">
                                   <div className="flex-1 items-center">
                                        <h3 className="text-2xl font-bold text-teal-800 px-2 flex items-center">
                                             <StadiumIcon className="w-6 h-6 mr-2 text-teal-500" />
                                             {complex.name}
                                        </h3>
                                   </div>
                                   <div className="text-xl font-bold text-teal-600 flex items-center">
                                        <AttachMoneyIcon className="w-5 h-5 mr-1" />
                                        {formatPrice(complex.minPriceForSelectedSlot)}
                                   </div>
                              </div>
                              <div className="flex justify-between items-center">
                                   <div className="text-sm items-center flex text-gray-500">
                                        <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">{complex.availableFields}/{complex.totalFields} sân</span>
                                   </div>
                                   <div className="flex space-x-2">
                                        <Button type="button" className="bg-teal-500 hover:bg-teal-600 text-white py-1 px-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105">
                                             <EyeIcon className="w-4 h-4" />
                                        </Button>
                                   </div>
                              </div>
                         </div>
                    </div>
               </Link>
          </FadeIn>
     );
}

