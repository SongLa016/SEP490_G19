import { Info, Star, MapPin, Images } from "lucide-react";
import { Container, Card, CardContent, Button } from "../../../../../../shared/components/ui";

export default function TabsHeader({ activeTab, setActiveTab }) {
     const tabs = [
          { key: "info", label: "Thông tin", icon: Info },
          { key: "review", label: "Đánh giá", icon: Star },
          { key: "location", label: "Vị trí", icon: MapPin },
          { key: "gallery", label: "Thư viện ảnh", icon: Images },
     ];

     return (
          <Container id="tabs-header" className="-mt-32 md:-mt-20 px-5 py-2 relative z-10">
               <Card className="border p-1 mx-20 bg-white/80 backdrop-blur rounded-2xl shadow-xl">
                    <CardContent className="p-1">
                         <div className="relative">
                              <div className="grid grid-cols-4 gap-1">
                                   {tabs.map(t => (
                                        <Button
                                             key={t.key}
                                             type="button"
                                             onClick={() => setActiveTab(t.key)}
                                             className={`group relative flex items-center justify-center gap-2 h-14 sm:h-16 rounded-xl transition-all duration-300 ease-in-out overflow-visible ${activeTab === t.key
                                                  ? "bg-gradient-to-br from-teal-500/10 via-emerald-50/50 to-teal-50 shadow-md shadow-teal-100/50 scale-[1.02] text-teal-800 border border-teal-200/50"
                                                  : "bg-white/80 hover:bg-gradient-to-br hover:from-teal-50/60 hover:to-white hover:scale-[1.01] text-gray-600 hover:text-teal-700 border border-transparent hover:border-teal-100"
                                                  }`}
                                        >
                                             {/* Hover effect overlay */}
                                             <div className={`absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out rounded-xl ${activeTab === t.key ? "opacity-100" : ""}`} />

                                             <span className={`relative z-10 inline-flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${activeTab === t.key
                                                  ? "border-2 border-teal-500 bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg shadow-teal-200/50 scale-110"
                                                  : "border border-teal-200 bg-teal-50/80 group-hover:border-teal-400 group-hover:bg-gradient-to-br group-hover:from-teal-50 group-hover:to-white group-hover:scale-105 group-hover:shadow-sm"
                                                  }`}>
                                                  <t.icon className={`w-5 h-5 transition-all duration-300 ${activeTab === t.key ? "text-white scale-110" : "text-teal-600 group-hover:text-teal-700"
                                                       }`} />
                                             </span>

                                             <span className={`relative z-10 font-semibold text-xl transition-all duration-300 ${activeTab === t.key
                                                  ? "text-teal-800 font-bold"
                                                  : "text-gray-600 group-hover:text-teal-700"
                                                  }`}>
                                                  {t.label}
                                             </span>

                                             {/* Border-bottom with smooth animation */}
                                             <div
                                                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 rounded-full transition-all duration-300 ease-out ${activeTab === t.key
                                                       ? "opacity-100 scale-x-100 w-[80%] mx-auto"
                                                       : "opacity-0 scale-x-0 group-hover:opacity-50 group-hover:scale-x-50"
                                                       }`}
                                                  style={{
                                                       transformOrigin: "center"
                                                  }}
                                             />
                                        </Button>
                                   ))}
                              </div>
                         </div>
                    </CardContent>
               </Card>
          </Container>
     );
}

