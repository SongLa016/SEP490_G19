import { useState } from "react";
import { Plus, Loader2, Check } from "lucide-react";
import { Button, Input } from "./ui";
import { createFieldType } from "../services/fieldTypes";
import Swal from "sweetalert2";

/**
 * Quick add field type component
 * Allows adding new field type inline without opening separate page
 */
export default function QuickAddFieldType({ onSuccess }) {
     const [isAdding, setIsAdding] = useState(false);
     const [newTypeName, setNewTypeName] = useState("");
     const [isSubmitting, setIsSubmitting] = useState(false);

     const handleQuickAdd = async () => {
          if (!newTypeName.trim()) {
               Swal.fire({
                    icon: "warning",
                    title: "Thiếu thông tin",
                    text: "Vui lòng nhập tên loại sân",
                    confirmButtonColor: "#f59e0b"
               });
               return;
          }

          setIsSubmitting(true);
          try {
               const result = await createFieldType({
                    typeName: newTypeName.trim()
               });

               if (result.success) {
                    await Swal.fire({
                         icon: "success",
                         title: "Thành công!",
                         text: `Đã thêm loại sân "${newTypeName}"`,
                         timer: 2000,
                         showConfirmButton: false
                    });

                    setNewTypeName("");
                    setIsAdding(false);

                    // Callback to parent to refresh field types
                    if (onSuccess) {
                         onSuccess(result.data);
                    }
               } else {
                    await Swal.fire({
                         icon: "error",
                         title: "Không thể thêm",
                         text: result.error || "Có lỗi xảy ra",
                         confirmButtonColor: "#ef4444"
                    });
               }
          } catch (error) {
               console.error("Error quick adding field type:", error);
               await Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: error.message || "Có lỗi xảy ra khi thêm loại sân",
                    confirmButtonColor: "#ef4444"
               });
          } finally {
               setIsSubmitting(false);
          }
     };

     const handleCancel = () => {
          setNewTypeName("");
          setIsAdding(false);
     };

     if (!isAdding) {
          return (
               <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAdding(true)}
                    className="w-full mt-2 border-dashed border-2 border-teal-300 text-teal-700 hover:bg-teal-50"
               >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm loại sân mới
               </Button>
          );
     }

     return (
          <div className="mt-2 p-3 border-2 border-teal-200 rounded-lg bg-teal-50/50">
               <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tên loại sân mới
               </label>
               <div className="flex gap-2">
                    <Input
                         value={newTypeName}
                         onChange={(e) => setNewTypeName(e.target.value)}
                         placeholder="Ví dụ: Sân 9 người, Sân Futsal..."
                         className="flex-1"
                         disabled={isSubmitting}
                         onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                   e.preventDefault();
                                   handleQuickAdd();
                              }
                         }}
                    />
                    <Button
                         type="button"
                         size="sm"
                         onClick={handleQuickAdd}
                         disabled={isSubmitting || !newTypeName.trim()}
                         className="bg-teal-600 hover:bg-teal-700"
                    >
                         {isSubmitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                         ) : (
                              <Check className="w-4 h-4" />
                         )}
                    </Button>
                    <Button
                         type="button"
                         size="sm"
                         variant="outline"
                         onClick={handleCancel}
                         disabled={isSubmitting}
                    >
                         Hủy
                    </Button>
               </div>
               <p className="text-xs text-gray-500 mt-1">
                    Nhấn Enter hoặc click ✓ để thêm
               </p>
          </div>
     );
}