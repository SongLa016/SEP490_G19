import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export function Pagination({
     currentPage = 1,
     totalPages = 1,
     onPageChange,
     itemsPerPage = 10,
     totalItems = 0,
}) {
     // chuyển trang trước
     const handlePrevious = () => {
          if (currentPage > 1) {
               onPageChange(currentPage - 1);
          }
     };
     // chuyển trang sau
     const handleNext = () => {
          if (currentPage < totalPages) {
               onPageChange(currentPage + 1);
          }
     };
     // chuyển đến trang cụ thể
     const handlePageClick = (page) => {
          onPageChange(page);
     };

     // số trang
     const getPageNumbers = () => {
          const pages = [];
          const maxVisible = 5;

          if (totalPages <= maxVisible) {
               for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
               }
          } else {
               if (currentPage <= 3) {
                    for (let i = 1; i <= 4; i++) {
                         pages.push(i);
                    }
                    pages.push("...");
                    pages.push(totalPages);
               } else if (currentPage >= totalPages - 2) {
                    pages.push(1);
                    pages.push("...");
                    for (let i = totalPages - 3; i <= totalPages; i++) {
                         pages.push(i);
                    }
               } else {
                    pages.push(1);
                    pages.push("...");
                    pages.push(currentPage - 1);
                    pages.push(currentPage);
                    pages.push(currentPage + 1);
                    pages.push("...");
                    pages.push(totalPages);
               }
          }

          return pages;
     };

     if (totalPages <= 1) {
          return null;
     }

     const startItem = itemsPerPage && totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0;
     const endItem = itemsPerPage && totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : 0;
     const showItemInfo = itemsPerPage > 0 && totalItems > 0;

     return (
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
               {showItemInfo ? (
                    <div className="text-sm text-gray-600">
                         Hiển thị <span className="font-medium text-teal-600">{startItem}</span> đến{" "}
                         <span className="font-medium text-teal-600">{endItem}</span> trong tổng số{" "}
                         <span className="font-medium text-teal-600">{totalItems}</span>
                    </div>
               ) : (
                    <div />
               )}

               <div className="flex items-center gap-2">
                    <Button
                         variant="outline"
                         size="sm"
                         onClick={handlePrevious}
                         disabled={currentPage === 1}
                         className="rounded-full p-2"
                    >
                         <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {getPageNumbers().map((page, index) => {
                         if (page === "...") {
                              return (
                                   <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                                        ...
                                   </span>
                              );
                         }

                         return (
                              <Button
                                   key={page}
                                   variant={currentPage === page ? "default" : "outline"}
                                   size="sm"
                                   onClick={() => handlePageClick(page)}
                                   className={`rounded-full p-2 w-8 h-8 ${currentPage === page
                                        ? "bg-teal-600 text-white hover:bg-teal-700"
                                        : ""
                                        }`}
                              >
                                   {page}
                              </Button>
                         );
                    })}

                    <Button
                         variant="outline"
                         size="sm"
                         onClick={handleNext}
                         disabled={currentPage === totalPages}
                         className="rounded-full p-2"
                    >
                         <ChevronRight className="w-4 h-4" />
                    </Button>
               </div>
          </div>
     );
}

// Hook phân trang
export function usePagination(items = [], itemsPerPage = 10) {
     const [currentPage, setCurrentPage] = React.useState(1);

     const totalPages = Math.ceil(items.length / itemsPerPage);

     const currentItems = React.useMemo(() => {
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          return items.slice(startIndex, endIndex);
     }, [items, currentPage, itemsPerPage]);

     const handlePageChange = (page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
     };

     React.useEffect(() => {
          setCurrentPage(1);
     }, [items.length]);

     return {
          currentPage,
          totalPages,
          currentItems,
          handlePageChange,
          totalItems: items.length,
          itemsPerPage,
     };
}