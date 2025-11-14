import { Search, RefreshCcw } from "lucide-react";
import { Button } from "../../../../../shared/components/ui";

export default function EmptyState({ onReset }) {
     return (
          <div className="text-center py-12">
               <div className="text-gray-400 mb-4">
                    <Search className="w-16 h-16 mx-auto" />
               </div>
               <h3 className="text-lg font-semibold text-teal-800 mb-2">Không tìm thấy sân bóng</h3>
               <p className="text-teal-700 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
               <Button
                    onClick={onReset}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-xl font-semibold transition-colors"
               >
                    <RefreshCcw className="w-4 h-4" />
               </Button>
          </div>
     );
}

