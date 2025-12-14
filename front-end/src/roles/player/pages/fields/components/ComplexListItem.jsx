import { Link } from "react-router-dom";
import { MapPin, EyeIcon } from "lucide-react";
import StadiumIcon from '@mui/icons-material/Stadium';
import { Button, FadeIn } from "../../../../../shared/components/ui";

// Helper to get image URL for complex (only from Cloudinary)
const getComplexImageUrl = (complex) => {
     // Only use imageUrl from Cloudinary
     const imageUrl = complex.imageUrl || complex.ImageUrl || null;

     return imageUrl || "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg";
};

export default function ComplexListItem({ complex, index, navigate }) {
     return (
          <FadeIn key={complex.complexId} delay={index * 50}>
               <Link
                    key={complex.complexId}
                    to={`/complex/${complex.complexId}`}
                    onClick={(e) => { e.preventDefault(); navigate(`/complex/${complex.complexId}`); }}
                    className="block bg-white p-4 rounded-2xl shadow-md overflow-hidden border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-teal-200"
               >
                    <div className="flex gap-4">
                         {/* Image */}
                         <div
                              className="w-48 h-32 flex-shrink-0 rounded-xl overflow-hidden"
                              style={{
                                   backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.2)), url(${getComplexImageUrl(complex)})`,
                                   backgroundSize: "cover",
                                   backgroundPosition: "center",
                              }}
                         />

                         {/* Content */}
                         <div className="flex-1 flex flex-col justify-between py-1">
                              {/* Address */}
                              <div className="flex items-center text-teal-600 text-sm mb-2">
                                   <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                   <span className="line-clamp-1">{complex.address}</span>
                              </div>

                              {/* Name */}
                              <h3 className="text-xl font-bold text-gray-800 flex items-center mb-2">
                                   <StadiumIcon className="w-5 h-5 mr-2 text-teal-500" />
                                   {complex.name}
                              </h3>

                              {/* Footer */}
                              <div className="flex items-center justify-between">
                                   <span className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-sm font-medium">
                                        {complex.availableFields}/{complex.totalFields} sân
                                   </span>
                                   <Button
                                        type="button"
                                        className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-full transition-all duration-200"
                                   >
                                        <EyeIcon className="w-4 h-4" />
                                   </Button>
                              </div>
                         </div>
                    </div>
               </Link>
          </FadeIn>
     );
}
