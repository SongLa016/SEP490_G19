import { useState } from "react";
import {
     Plus,
     Edit,
     Trash2,
     Save,
     X,
     Loader2,
     Tag
} from "lucide-react";
import {
     Button,
     Card,
     Input,
     Modal,
     Table,
     TableHeader,
     TableHead,
     TableRow,
     TableBody,
     TableCell,
     Pagination,
     usePagination
} from "../../../shared/components/ui";
import OwnerLayout from "../layouts/OwnerLayout";
import { useAuth } from "../../../contexts/AuthContext";
import { DemoRestrictedModal } from "../../../shared";
import { useFieldTypes } from "../../../shared/hooks";
import {
     createFieldType,
     updateFieldType,
     deleteFieldType,
     normalizeFieldType
} from "../../../shared/services/fieldTypes";
import Swal from "sweetalert2";

export default function FieldTypeManagement({ isDemo = false }) {
     const { user, logout } = useAuth();

     // Use React Query hook for field types with caching
     const { data: fieldTypes = [], isLoading: loading, refetch } = useFieldTypes();

     const [showModal, setShowModal] = useState(false);
     const [editingType, setEditingType] = useState(null);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [formData, setFormData] = useState({
          typeName: ""
     });

     // Pagination for field types (8 per page)
     const {
          currentPage,
          totalPages,
          currentItems: paginatedFieldTypes,
          handlePageChange,
          totalItems,
          itemsPerPage,
     } = usePagination(fieldTypes, 8);

     const handleOpenModal = (fieldType = null) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          if (fieldType) {
               const normalized = normalizeFieldType(fieldType);
               setEditingType(normalized);
               setFormData({
                    typeName: normalized.typeName || ""
               });
          } else {
               setEditingType(null);
               setFormData({
                    typeName: ""
               });
          }
          setShowModal(true);
     };

     const handleCloseModal = () => {
          setShowModal(false);
          setEditingType(null);
          setFormData({
               typeName: ""
          });
     };

     const handleInputChange = (e) => {
          const { name, value } = e.target;
          setFormData(prev => ({
               ...prev,
               [name]: value
          }));
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          // Validate
          if (!formData.typeName.trim()) {
               Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Vui lòng nhập tên loại sân",
                    confirmButtonColor: "#ef4444"
               });
               return;
          }

          setIsSubmitting(true);
          try {
               let result;
               if (editingType) {
                    result = await updateFieldType(editingType.typeId, {
                         typeName: formData.typeName.trim()
                    });
               } else {
                    result = await createFieldType({
                         typeName: formData.typeName.trim()
                    });
               }

               if (result.success) {
                    await Swal.fire({
                         icon: "success",
                         title: editingType ? "Cập nhật thành công!" : "Tạo thành công!",
                         text: result.message,
                         confirmButtonColor: "#10b981"
                    });
                    handleCloseModal();
                    refetch(); // Refresh data
               } else {
                    await Swal.fire({
                         icon: "error",
                         title: "Không thể lưu",
                         text: result.error || "Có lỗi xảy ra",
                         confirmButtonColor: "#ef4444"
                    });
               }
          } catch (error) {
               console.error("Error saving field type:", error);
               await Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: error.message || "Có lỗi xảy ra khi lưu loại sân",
                    confirmButtonColor: "#ef4444"
               });
          } finally {
               setIsSubmitting(false);
          }
     };

     const handleDelete = async (fieldType) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          const normalized = normalizeFieldType(fieldType);
          const confirm = await Swal.fire({
               title: "Xác nhận xóa",
               text: `Bạn có chắc chắn muốn xóa loại sân "${normalized.typeName}"?`,
               icon: "warning",
               showCancelButton: true,
               confirmButtonText: "Xóa",
               cancelButtonText: "Hủy",
               confirmButtonColor: "#dc2626"
          });

          if (!confirm.isConfirmed) return;

          try {
               const result = await deleteFieldType(normalized.typeId);
               if (result.success) {
                    await Swal.fire({
                         title: "Đã xóa",
                         text: "Xóa loại sân thành công",
                         icon: "success",
                         confirmButtonText: "OK"
                    });
                    refetch(); // Refresh data
               } else {
                    await Swal.fire({
                         title: "Không thể xóa",
                         text: result.error,
                         icon: "error",
                         confirmButtonText: "OK"
                    });
               }
          } catch (error) {
               console.error("Error deleting field type:", error);
               await Swal.fire({
                    title: "Có lỗi xảy ra",
                    text: "Có lỗi xảy ra khi xóa loại sân",
                    icon: "error",
                    confirmButtonText: "OK"
               });
          }
     };

     if (loading) {
          return (
               <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
                    <div className="flex items-center justify-center h-64">
                         <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    </div>
               </OwnerLayout>
          );
     }

     return (
          <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
               <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900">Quản lý loại sân</h1>
                              <p className="text-gray-600 mt-1">Quản lý các loại sân bóng (5 người, 7 người, 11 người...)</p>
                         </div>

                         <Button
                              onClick={() => handleOpenModal()}
                              className="flex items-center space-x-2 rounded-2xl"
                         >
                              <Plus className="w-4 h-4" />
                              <span>Thêm loại sân</span>
                         </Button>
                    </div>

                    {/* Field Types Table */}
                    <Card className="overflow-hidden rounded-2xl shadow-lg">
                         <Table>
                              <TableHeader>
                                   <TableRow className="bg-teal-700">
                                        <TableHead className="text-white">ID</TableHead>
                                        <TableHead className="text-white">Tên loại sân</TableHead>
                                        <TableHead className="text-white">Thao tác</TableHead>
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
                                                  <TableCell className="text-sm font-medium">
                                                       <div className="flex items-center space-x-2">
                                                            <Button
                                                                 variant="ghost"
                                                                 size="sm"
                                                                 onClick={() => handleOpenModal(fieldType)}
                                                            >
                                                                 <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                 variant="ghost"
                                                                 size="sm"
                                                                 onClick={() => handleDelete(fieldType)}
                                                                 className="text-red-600 hover:text-red-700"
                                                            >
                                                                 <Trash2 className="w-4 h-4" />
                                                            </Button>
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
                                   <p className="text-gray-500">Hãy thêm loại sân đầu tiên.</p>
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

                    {/* Add/Edit Modal */}
                    <Modal
                         isOpen={showModal}
                         onClose={handleCloseModal}
                         title={editingType ? "Chỉnh sửa loại sân" : "Thêm loại sân mới"}
                    >
                         <form onSubmit={handleSubmit} className="space-y-4">
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên loại sân *
                                   </label>
                                   <Input
                                        name="typeName"
                                        value={formData.typeName}
                                        onChange={handleInputChange}
                                        placeholder="Ví dụ: Sân 5 người, Sân 7 người..."
                                        required
                                   />
                                   <p className="text-xs text-gray-500 mt-1">
                                        Tên loại sân sẽ được hiển thị khi tạo sân mới
                                   </p>
                              </div>

                              <div className="flex justify-end space-x-3 pt-4">
                                   <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseModal}
                                   >
                                        <X className="w-4 h-4 mr-2" />
                                        Hủy
                                   </Button>
                                   <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                             <>
                                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                  Đang lưu...
                                             </>
                                        ) : (
                                             <>
                                                  <Save className="w-4 h-4 mr-2" />
                                                  {editingType ? "Cập nhật" : "Tạo mới"}
                                             </>
                                        )}
                                   </Button>
                              </div>
                         </form>
                    </Modal>

                    {/* Demo Restricted Modal */}
                    <DemoRestrictedModal
                         isOpen={showDemoRestrictedModal}
                         onClose={() => setShowDemoRestrictedModal(false)}
                         featureName="Quản lý loại sân"
                    />
               </div>
          </OwnerLayout>
     );
}
