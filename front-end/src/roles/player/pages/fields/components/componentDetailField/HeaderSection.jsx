import { MapPin, Star, Heart } from "lucide-react";
import { Container, Button } from "../../../../../../shared/components/ui";

export default function HeaderSection({ complex, user, onToggleFavoriteComplex }) {
     return (
          <div className="py-28 mx-5 md:py-36 bg-[url('https://i.pinimg.com/originals/a3/c7/79/a3c779e5d5b622eeb598ac1d50c05cb8.png')] bg-cover bg-center rounded-b-3xl overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-b from-teal-900/40 via-teal-800/30 to-teal-900/50" />
               <Container className="py-5 relative z-10">
                    <div className="absolute top-6 right-6">
                         <Button
                              type="button"
                              onClick={(e) => {
                                   e.preventDefault();
                                   e.stopPropagation();
                                   if (onToggleFavoriteComplex) onToggleFavoriteComplex(complex?.complexId);
                              }}
                              className={`h-10 w-10 p-0 rounded-full shadow-sm transition-all duration-200 border hover:scale-110 hover:text-pink-600 ${complex?.isFavorite ? "bg-teal-500 text-teal-50 border-teal-500" : "bg-white/90 text-teal-700 border-white/40 hover:bg-white"}`}
                         >
                              <Heart className="w-5 h-5" />
                         </Button>
                    </div>
                    <div className="text-center text-white drop-shadow-lg">
                         <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">{complex?.name || "Khu sân"}</h1>
                         <div className="mt-2 flex items-center justify-center gap-4 flex-wrap">
                              <span className="inline-flex items-center gap-2 bg-white/25 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 shadow-lg hover:bg-white/30 transition-all">
                                   <MapPin className="w-4 h-4 text-white" /> <span className="text-white font-medium text-sm">{complex?.address || ""}</span>
                              </span>
                              {complex?.rating && (
                                   <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-500 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-amber-300/30 hover:from-amber-500 hover:to-amber-600 transition-all">
                                        <Star className="w-4 h-4 text-white fill-white" /> <span className="text-white font-semibold">{complex.rating}</span>
                                   </span>
                              )}
                         </div>
                    </div>
               </Container>
          </div>
     );
}

