import { useState } from "react";
import { Plus, Loader2, Check, ChevronsUpDown, Tag } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button, Input, Popover, PopoverContent, PopoverTrigger } from "./ui";
import { useFieldTypes } from "../hooks";
import { createFieldType } from "../services/fieldTypes";
import Swal from "sweetalert2";

/**
 * FieldTypeCombobox - Specialized combobox for field types
 * Allows selecting existing types or creating new ones inline
 */
export default function FieldTypeCombobox({
     value,
     onValueChange,
     placeholder = "Chọn hoặc nhập loại sân...",
     className,
     disabled = false,
     required = false,
}) {
     const [open, setOpen] = useState(false);
     const [searchValue, setSearchValue] = useState("");
     const [isCreating, setIsCreating] = useState(false);

     // Load field types with React Query
     const { data: fieldTypes = [], refetch } = useFieldTypes();

     // Find selected field type
     const selectedType = fieldTypes.find((type) =>
          String(type.typeId) === String(value) || type.typeName === value
     );

     // Display value
     const displayValue = selectedType?.typeName || "";

     // Filter field types based on search
     const filteredTypes = fieldTypes.filter((type) =>
          type.typeName.toLowerCase().includes(searchValue.toLowerCase())
     );

     // Check if search value is a new type (not in existing list)
     const isNewType = searchValue &&
          !fieldTypes.some(type =>
               type.typeName.toLowerCase() === searchValue.toLowerCase()
          );

     const handleSelect = (typeId, typeName) => {
          onValueChange(typeId);
          setOpen(false);
          setSearchValue("");
     };

     const handleCreateNew = async () => {
          if (!searchValue.trim()) return;

          setIsCreating(true);
          try {
               const result = await createFieldType({
                    typeName: searchValue.trim()
               });

               if (result.success) {
                    await Swal.fire({
                         icon: "success",
                         title: "Thành công!",
                         text: `Đã thêm loại sân "${searchValue}"`,
                         timer: 2000,
                         showConfirmButton: false
                    });

                    // Refresh field types
                    await refetch();

                    // Auto select the new type
                    onValueChange(result.data.typeId);
                    setOpen(false);
                    setSearchValue("");
               } else {
                    await Swal.fire({
                         icon: "error",
                         title: "Không thể thêm",
                         text: result.error || "Có lỗi xảy ra",
                         confirmButtonColor: "#ef4444"
                    });
               }
          } catch (error) {
               console.error("Error creating field type:", error);
               await Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: error.message || "Có lỗi xảy ra khi thêm loại sân",
                    confirmButtonColor: "#ef4444"
               });
          } finally {
               setIsCreating(false);
          }
     };

     return (
          <Popover open={open} onOpenChange={setOpen}>
               <PopoverTrigger asChild>
                    <Button
                         variant="outline"
                         role="combobox"
                         aria-expanded={open}
                         className={cn(
                              "w-full justify-between",
                              !displayValue && "text-gray-500",
                              className
                         )}
                         disabled={disabled}
                    >
                         <span className="truncate flex items-center gap-2">
                              {displayValue ? (
                                   <>
                                        <Tag className="w-4 h-4 text-teal-600" />
                                        {displayValue}
                                   </>
                              ) : (
                                   placeholder
                              )}
                         </span>
                         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
               </PopoverTrigger>
               <PopoverContent className="w-full p-0" align="start">
                    <div className="flex flex-col">
                         {/* Search Input */}
                         <div className="flex items-center border-b px-3">
                              <Input
                                   placeholder="Tìm hoặc nhập loại sân mới..."
                                   value={searchValue}
                                   onChange={(e) => setSearchValue(e.target.value)}
                                   className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                   onKeyDown={(e) => {
                                        if (e.key === "Enter" && isNewType) {
                                             e.preventDefault();
                                             handleCreateNew();
                                        }
                                   }}
                              />
                         </div>

                         {/* Options List */}
                         <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                              {filteredTypes.length === 0 && !isNewType ? (
                                   <div className="py-6 text-center text-sm text-gray-500">
                                        Không tìm thấy loại sân.
                                   </div>
                              ) : (
                                   <div className="p-1">
                                        {filteredTypes.map((type) => (
                                             <div
                                                  key={type.typeId}
                                                  onClick={() => handleSelect(type.typeId, type.typeName)}
                                                  className={cn(
                                                       "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-gray-100 transition-colors",
                                                       String(value) === String(type.typeId) && "bg-teal-50"
                                                  )}
                                             >
                                                  <Check
                                                       className={cn(
                                                            "mr-2 h-4 w-4 text-teal-600",
                                                            String(value) === String(type.typeId) ? "opacity-100" : "opacity-0"
                                                       )}
                                                  />
                                                  <Tag className="mr-2 h-4 w-4 text-gray-400" />
                                                  {type.typeName}
                                             </div>
                                        ))}

                                        {/* Create New Option */}
                                        {isNewType && (
                                             <div
                                                  onClick={handleCreateNew}
                                                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-teal-50 transition-colors border-t mt-1 pt-2"
                                             >
                                                  {isCreating ? (
                                                       <Loader2 className="mr-2 h-4 w-4 animate-spin text-teal-600" />
                                                  ) : (
                                                       <Plus className="mr-2 h-4 w-4 text-teal-600" />
                                                  )}
                                                  <span className="text-teal-700 font-medium">
                                                       Thêm "{searchValue}"
                                                  </span>
                                             </div>
                                        )}
                                   </div>
                              )}
                         </div>

                         {/* Helper Text */}
                         {isNewType && (
                              <div className="border-t px-3 py-2 text-xs text-gray-500 bg-gray-50">
                                   Nhấn Enter hoặc click để thêm loại sân mới
                              </div>
                         )}
                    </div>
               </PopoverContent>
          </Popover>
     );
}