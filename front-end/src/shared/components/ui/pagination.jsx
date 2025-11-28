import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

/**
 * Pagination Component
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when page changes
 * @param {number} itemsPerPage - Items per page
 * @param {number} totalItems - Total number of items
 */
export function Pagination({
     currentPage = 1,
     totalPages = 1,
     onPageChange,
     itemsPerPage,
     totalItems,
}) {
     const handlePrevious = () => {
          if (currentPage > 1) {
               onPageChange(currentPage - 1);
          }
     };

     const handleNext = () => {
          if (currentPage < totalPages) {
               onPageChange(currentPage + 1);
          }
     };

     const handlePageClick = (page) => {
          onPageChange(page);
     };

     // Generate page numbers to display
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

     const startItem = (currentPage - 1) * itemsPerPage + 1;
     const endItem = Math.min(currentPage * itemsPerPage, totalItems);

     return (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
               <div className="text-sm text-gray-600">
                    Hiển thị <span className="font-medium text-teal-600">{startItem}</span> đến{" "}
                    <span className="font-medium text-teal-600">{endItem}</span> trong tổng số{" "}
                    <span className="font-medium text-teal-600">{totalItems}</span>
               </div>

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

/**
 * Custom hook for pagination logic
 * @param {Array} items - Array of items to paginate
 * @param {number} itemsPerPage - Number of items per page
 */
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

     // Reset to page 1 when items change
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
