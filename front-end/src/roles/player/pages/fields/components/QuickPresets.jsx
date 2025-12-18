import { Sparkles } from "lucide-react";
import { Button } from "../../../../../shared/components/ui";

export default function QuickPresets({ quickPresets, activeTab, setActiveTab, typeTab, setTypeTab, setPage }) {
     return (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
               {quickPresets.map(p => (
                    <Button
                         key={p.key}
                         onClick={() => {
                              // Toggle: nếu đang chọn, trả về "all"; nếu chưa, kích hoạt preset
                              const nextTab = activeTab === p.key ? "all" : p.key;
                              setActiveTab(nextTab);
                              setPage(1);
                         }}
                         className={`px-2 h-8 rounded-full text-xs border ${activeTab === p.key ? "bg-teal-100 hover:bg-teal-600 text-teal-700 border-teal-200" : "bg-white text-teal-600 transition-all duration-200 border-gray-200 hover:bg-teal-600 hover:text-white hover:border-gray-300"}`}
                    >
                         <Sparkles className="w-3 h-3 inline mr-1" /> {p.label}
                    </Button>
               ))}

               {/* Type tabs for viewing more small fields by type */}
               <div className="ml-3 inline-flex rounded-full overflow-hidden border border-teal-200">
                    {[
                         { k: "all", l: "Tất cả" },
                         { k: "5vs5", l: "5 người" },
                         { k: "7vs7", l: "7 người" },
                    ].map(t => (
                         <Button
                              key={t.k}
                              type="button"
                              onClick={() => { setTypeTab(t.k); setPage(1); }}
                              className={`px-3 h-8 text-xs rounded-none ${typeTab === t.k ? "bg-teal-500 scale-110 transition-all duration-200 text-white" : "bg-white text-teal-700 hover:bg-teal-600 hover:scale-110 transition-all duration-200"}`}
                         >
                              {t.l}
                         </Button>
                    ))}
               </div>
          </div>
     );
}

