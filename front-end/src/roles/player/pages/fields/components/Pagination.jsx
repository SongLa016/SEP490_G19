import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../../../shared/components/ui";

export default function Pagination({ currentPage, totalPages, onPrev, onNext, onPageChange, totalItems, startIdx, endIdx }) {
     return (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
               <div className="text-sm text-teal-700">
                    Trang {currentPage}/{totalPages} • {Math.min(endIdx, totalItems)} trên {totalItems} {totalItems > 1 ? "kết quả" : "kết quả"}
               </div>
               <div className="flex items-center gap-2">
                    <Button
                         type="button"
                         onClick={onPrev}
                         disabled={currentPage === 1}
                         className={`px-3 py-1 rounded-full items-center justify-center border transition-colors ${currentPage === 1 ? "bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed" : "bg-white text-teal-600 border-teal-200 hover:border-teal-300 hover:bg-teal-50"}`}
                    >
                         <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                         {(() => {
                              const pages = [];
                              const maxVisiblePages = 5;
                              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                              if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1);

                              if (startPage > 1) {
                                   pages.push(
                                        <Button key={1} onClick={() => onPageChange(1)} className="px-3 py-1 rounded-full border border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-500 hover:text-white hover:border-teal-300 transition-colors">1</Button>
                                   );
                                   if (startPage > 2) pages.push(<span key="ellipsis1" className="px-2 text-teal-400 bg-teal-50">...</span>);
                              }

                              for (let i = startPage; i <= endPage; i++) {
                                   pages.push(
                                        <Button
                                             key={i}
                                             onClick={() => onPageChange(i)}
                                             className={`px-4 py-1 rounded-full border transition-colors ${i === currentPage
                                                  ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600"
                                                  : "border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-500 hover:text-white hover:border-teal-300"
                                                  }`}
                                        >
                                             {i}
                                        </Button>
                                   );
                              }

                              if (endPage < totalPages) {
                                   if (endPage < totalPages - 1) pages.push(<span key="ellipsis2" className="px-2 text-teal-400 bg-teal-50">...</span>);
                                   pages.push(
                                        <Button key={totalPages} onClick={() => onPageChange(totalPages)} className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 transition-colors">
                                             {totalPages}
                                        </Button>
                                   );
                              }

                              return pages;
                         })()}
                    </div>
                    <Button
                         type="button"
                         onClick={onNext}
                         disabled={currentPage === totalPages}
                         className={`px-3 py-1 rounded-full border transition-colors ${currentPage === totalPages ? "bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed" : "bg-white text-teal-600 border-teal-200 hover:border-teal-300 hover:bg-teal-50"}`}
                    >
                         <ChevronRight className="w-4 h-4" />
                    </Button>
               </div>
          </div>
     );
}

