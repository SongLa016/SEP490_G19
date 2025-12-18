import { Loader2, Tag } from "lucide-react";
import {
     Card,
     Table,
     TableHeader,
     TableHead,
     TableRow,
     TableBody,
     TableCell,
     Pagination,
     usePagination
} from "../../../shared/components/ui";
import { useFieldTypes } from "../../../shared/hooks";
import { normalizeFieldType } from "../../../shared/services/fieldTypes";

export default function FieldTypeManagement() {
     const { data: fieldTypes = [], isLoading: loading } = useFieldTypes();
     // Phân trang 
     const {
          currentPage,
          totalPages,
          currentItems: paginatedFieldTypes,
          handlePageChange,
          totalItems,
          itemsPerPage,
     } = usePagination(fieldTypes, 8);

     if (loading) {
          return (
               <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
               </div>
          );
     }

     return (
          <div className="space-y-6">
               {/* Header */}
               <div className="flex justify-between items-center">
                    <div>
                         <h1 className="text-3xl font-bold text-gray-900">Quản lý loại sân</h1>
                         <p className="text-gray-600 mt-1">Danh sách các loại sân bóng (5 người, 7 người, 11 người...)</p>
                    </div>
               </div>

               {/* Field Types Table */}
               <Card className="overflow-hidden rounded-2xl shadow-lg">
                    <Table>
                         <TableHeader>
                              <TableRow className="bg-teal-700">
                                   <TableHead className="text-white">ID</TableHead>
                                   <TableHead className="text-white">Tên loại sân</TableHead>
                              </TableRow>
                         </TableHeader>
                         <TableBody>
                              {paginatedFieldTypes.map((fieldType) => {
                                   const normalized = normalizeFieldType(fieldType);
                                   return (
                                        <TableRow key={normalized.typeId} className="hover:bg-slate-50">
                                             <TableCell className="text-sm font-medium text-gray-900">
                                                  {normalized.typeId}
                                             </TableCell>
                                             <TableCell className="text-sm text-gray-900">
                                                  <div className="flex items-center gap-2">
                                                       <Tag className="w-4 h-4 text-teal-600" />
                                                       {normalized.typeName}
                                                  </div>
                                             </TableCell>
                                        </TableRow>
                                   );
                              })}
                         </TableBody>
                    </Table>
                    {fieldTypes.length === 0 && (
                         <div className="text-center py-12">
                              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có loại sân nào</h3>
                              <p className="text-gray-500">Hiện tại chưa có loại sân nào trong hệ thống.</p>
                         </div>
                    )}
                    {fieldTypes.length > 0 && (
                         <div className="p-4 border-t">
                              <Pagination
                                   currentPage={currentPage}
                                   totalPages={totalPages}
                                   onPageChange={handlePageChange}
                                   itemsPerPage={itemsPerPage}
                                   totalItems={totalItems}
                              />
                         </div>
                    )}
               </Card>

               {/* Summary Card */}
               <Card className="p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center">
                         <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                              <Tag className="w-6 h-6 text-teal-600" />
                         </div>
                         <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Tổng số loại sân</p>
                              <p className="text-2xl font-bold text-gray-900">{fieldTypes.length}</p>
                         </div>
                    </div>
               </Card>
          </div>
     );
}
