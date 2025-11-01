import { Images } from "lucide-react";
import { FadeIn } from "../../../../../../shared/components/ui";

export default function GalleryTabContent({ galleryImages, onImageClick }) {
     return (
          <FadeIn delay={100}>
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center">
                         <h3 className="text-2xl font-extrabold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">Thư viện ảnh</h3>
                         <div className="mt-2 h-1 w-32 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 rounded-full mx-auto" />
                         <p className="text-gray-600 mt-3 font-medium">Bao gồm ảnh khu sân và tất cả sân nhỏ</p>
                    </div>

                    {galleryImages.length > 0 ? (
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {galleryImages.map((img, i) => (
                                   <div key={i} className="relative group cursor-pointer overflow-hidden rounded-xl border border-teal-200/50 shadow-md hover:shadow-2xl transition-all hover:scale-[1.02]" onClick={() => onImageClick(i)}>
                                        <img
                                             src={img}
                                             alt={`gallery-${i}`}
                                             className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl" />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                             <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110">
                                                  <div className="bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-xl border border-teal-200/50">
                                                       <Images className="w-6 h-6 text-teal-600" />
                                                  </div>
                                             </div>
                                        </div>
                                        {i === 0 && (
                                             <div className="absolute top-2 left-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-teal-400/30">
                                                  Khu sân
                                             </div>
                                        )}
                                   </div>
                              ))}
                         </div>
                    ) : (
                         <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-teal-50/30 rounded-2xl border border-teal-200/50">
                              <Images className="w-20 h-20 text-gray-400 mx-auto mb-4 opacity-50" />
                              <p className="text-gray-500 font-medium">Chưa có ảnh nào</p>
                         </div>
                    )}
               </div>
          </FadeIn>
     );
}

