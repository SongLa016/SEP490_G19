import { FadeIn } from "../../../../../shared/components/ui";

export default function LoadingState() {
     return (
          <FadeIn>
               <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="relative">
                         <div className="w-16 h-16 border-4 border-teal-200 rounded-full animate-pulse"></div>
                         <div className="absolute inset-0 w-16 h-16 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-teal-700 font-medium text-lg animate-pulse">Đang tải dữ liệu sân bóng...</p>
               </div>
          </FadeIn>
     );
}

