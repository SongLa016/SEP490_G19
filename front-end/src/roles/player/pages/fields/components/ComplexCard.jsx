import { Link } from "react-router-dom";
import { MapPin, EyeIcon } from "lucide-react";
import StadiumIcon from '@mui/icons-material/Stadium';
import { Button, FadeIn } from "../../../../../shared/components/ui";
import { getImageProps } from "../../../../../shared/utils/imageUtils";

export default function ComplexCard({ complex, index, navigate, formatPrice }) {
     return (
          <FadeIn key={complex.complexId} delay={index * 50}>
               <Link
                    key={complex.complexId}
                    to={`/complex/${complex.complexId}`}
                    onClick={(e) => { e.preventDefault(); navigate(`/complex/${complex.complexId}`); }}
                    className="group bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1"
               >
                    <div className="relative overflow-hidden">
                         <img {...getImageProps(complex.image, complex.name)} className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-110" draggable={false} />
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                         <h3 className="text-xl font-semibold text-teal-800 mb-1 flex items-center">
                              <StadiumIcon className="w-5 h-5 mr-2 text-teal-500" />
                              {complex.name}
                         </h3>
                         <div className="flex items-center text-teal-700 mb-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="text-sm">{complex.address}</span>
                         </div>
                         <div className="flex items-center justify-between">
                              <span className="text-sm bg-teal-50 text-teal-700 px-2 py-1 rounded-full border border-teal-200">{complex.availableFields}/{complex.totalFields} sân trống</span>
                              <span className="text-lg font-bold text-teal-600 flex items-center">
                                   <Button className="bg-teal-500 hover:bg-teal-600 text-white text-xs rounded-2xl font-semibold transition-all duration-200 hover:scale-105">
                                        <EyeIcon className="w-5 h-5" />
                                   </Button>
                              </span>
                         </div>
                    </div>
               </Link>
          </FadeIn>
     );
}

