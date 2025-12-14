import { MapPin } from "lucide-react";
import { FadeIn, Button } from "../../../../../../shared/components/ui";

export default function LocationTabContent({ complex }) {
     const handleCopyAddress = () => {
          const addr = complex?.address || "";
          if (!addr) return;
          if (navigator?.clipboard?.writeText) {
               navigator.clipboard.writeText(addr);
          }
     };

     return (
          <FadeIn delay={100}>
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center">
                         <h3 className="text-2xl font-extrabold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">Vị trí sân</h3>
                         <div className="mt-2 h-1 w-32 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 rounded-full mx-auto" />
                    </div>
                    <div className="space-y-4">
                         <div className="border border-teal-200/50 bg-gradient-to-br from-white via-teal-50/30 to-white rounded-2xl p-5 shadow-md">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                   <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md">
                                             <MapPin className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                             <div className="text-xs text-gray-500 uppercase font-medium mb-1">Địa chỉ</div>
                                             <div className="font-semibold text-teal-800 text-base">{complex?.address || ""}</div>
                                        </div>
                                   </div>
                                   <div className="flex items-center gap-2">
                                        <Button
                                             type="button"
                                             variant="outline"
                                             className="rounded-xl border-teal-300/50 text-teal-700 hover:text-teal-800 hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 hover:border-teal-400 shadow-sm transition-all"
                                             onClick={handleCopyAddress}
                                        >
                                             Sao chép địa chỉ
                                        </Button>
                                        <a
                                             href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(complex?.address || "")}`}
                                             target="_blank"
                                             rel="noreferrer"
                                             className="inline-flex items-center px-4 py-2 bg-gradient-to-r truncate from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium"
                                        >
                                             <MapPin className="w-4 h-4 mr-2" />
                                             Mở Google Maps
                                        </a>
                                   </div>
                              </div>
                         </div>
                         <div className="overflow-hidden rounded-2xl border-2 border-teal-300/50 shadow-xl bg-white">
                              <div className="relative w-full h-[420px] md:h-[600px]">
                                   <iframe
                                        title="map"
                                        className="absolute inset-0 w-full h-full"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps?q=${encodeURIComponent(complex?.address || "")}&output=embed`}
                                   />
                              </div>
                         </div>
                    </div>
               </div>
          </FadeIn>
     );
}

