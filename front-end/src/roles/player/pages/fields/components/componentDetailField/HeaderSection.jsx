import { MapPin, Star } from "lucide-react";
import { Container } from "../../../../../../shared/components/ui";

export default function HeaderSection({ complex }) {
     return (
          <div className="py-28 mx-5 md:py-36 bg-[url('https://i.pinimg.com/originals/a3/c7/79/a3c779e5d5b622eeb598ac1d50c05cb8.png')] bg-cover bg-center rounded-b-3xl overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-b from-teal-900/40 via-teal-800/30 to-teal-900/50" />
               <Container className="py-5 relative z-10">
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

