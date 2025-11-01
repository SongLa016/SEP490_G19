import { Grid, List } from "lucide-react";
import { Button } from "../../../../../shared/components/ui";

export default function ResultsHeader({ entityTab, complexesCount, filteredFieldsCount, activeTab, viewMode, updateViewMode }) {
     const count = entityTab === "complexes" ? complexesCount : filteredFieldsCount;
     const noun = entityTab === "complexes" ? "khu sân" : "sân bóng";
     const filterLabel = activeTab === "near" ? "• Gần bạn" : activeTab === "best-price" ? "• Giá tốt" : activeTab === "top-rated" ? "• Đánh giá cao" : activeTab === "favorites" ? "• Yêu thích" : "";

     return (
          <div className="flex justify-between items-center mb-5">
               <div>
                    <h1 className="text-2xl font-bold text-teal-800">
                         {`Tìm thấy ${count} ${noun} ${filterLabel}`.trim()}
                    </h1>
                    <div className="mt-1 h-1.5 w-44 bg-gradient-to-l from-teal-500 via-emerald-400 to-transparent rounded-full justify-self-end" />
               </div>
               <div className="flex items-center space-x-2">
                    <Button
                         type="button"
                         onClick={() => updateViewMode("grid")}
                         className={`p-2 rounded-xl ${viewMode === "grid" ? "bg-teal-500 text-white hover:bg-teal-600" : "bg-teal-50 text-gray-400 border border-gray-200 hover:bg-teal-600"}`}
                    >
                         <Grid className="w-5 h-5" />
                    </Button>
                    <Button
                         type="button"
                         onClick={() => updateViewMode("list")}
                         className={`px-2 rounded-xl ${viewMode === "list" ? "bg-teal-500 text-white hover:bg-teal-600" : "bg-teal-50 text-gray-400 border border-gray-200 hover:bg-teal-600"}`}
                    >
                         <List className="w-5 h-5" />
                    </Button>
               </div>
          </div>
     );
}

