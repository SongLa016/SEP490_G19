import React, { useState, useEffect } from "react";
import {
     Card,
     Button,
     Input,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
     Badge,
     Modal,
     Table,
     TableHeader,
     TableBody,
     TableRow,
     TableHead,
     TableCell,
     Avatar,
     AvatarImage,
     AvatarFallback
} from "../../../shared/components/ui";
import {
     Search,
     Eye,
     CheckCircle,
     XCircle,
     Building,
     Calendar,
     DollarSign,
     User,
     RefreshCw
} from "lucide-react";
import { fetchFields, fetchFieldComplexes, fetchField, fetchFieldComplex } from "../../../shared/services/fields";
import { updateFieldComplex } from "../../../shared/services/fields";
import Swal from "sweetalert2";

export default function FieldManagement() {
     const [viewMode, setViewMode] = useState("complexes"); // "complexes" hoặc "fields"
     const [complexes, setComplexes] = useState([]);
     const [fields, setFields] = useState([]);
     const [filteredData, setFilteredData] = useState([]);
     const [searchTerm, setSearchTerm] = useState("");
     const [statusFilter, setStatusFilter] = useState("Pending");
     const [selectedItem, setSelectedItem] = useState(null);
     const [showDetailModal, setShowDetailModal] = useState(false);
     const [isLoading, setIsLoading] = useState(true);
     const [isRefreshing, setIsRefreshing] = useState(false);

     useEffect(() => {
          loadData();
     }, [statusFilter, viewMode]);

     useEffect(() => {
          let filtered = viewMode === "complexes" ? complexes : fields;

          // Filter by search term
          if (searchTerm) {
               const searchValue = searchTerm.toLowerCase();
               if (viewMode === "complexes") {
                    filtered = filtered.filter(complex =>
                         (complex.name || complex.Name || "").toLowerCase().includes(searchValue) ||
                         (complex.address || complex.Address || "").toLowerCase().includes(searchValue) ||
                         (complex.ownerName || complex.OwnerName || "").toLowerCase().includes(searchValue)
                    );
               } else {
                    filtered = filtered.filter(field =>
                         (field.name || "").toLowerCase().includes(searchValue) ||
                         (field.complexName || "").toLowerCase().includes(searchValue) ||
                         (field.description || "").toLowerCase().includes(searchValue)
                    );
               }
          }

          setFilteredData(filtered);
     }, [complexes, fields, searchTerm, viewMode]);

     const loadData = async () => {
          try {
               setIsLoading(true);
               // Lấy tất cả complexes
               const allComplexes = await fetchFieldComplexes();

               // Lấy số lượng sân cho mỗi complex và fields
               const complexesWithFieldCount = await Promise.all(
                    allComplexes.map(async (complex) => {
                         try {
                              const fields = await fetchFields({ complexId: complex.complexId });
                              return {
                                   ...complex,
                                   fieldCount: Array.isArray(fields) ? fields.length : 0
                              };
                         } catch (error) {
                              console.error(`Error fetching fields for complex ${complex.complexId}:`, error);
                              return {
                                   ...complex,
                                   fieldCount: 0
                              };
                         }
                    })
               );

               // Filter complexes theo status
               let filteredComplexes = complexesWithFieldCount;
               if (statusFilter !== "all") {
                    filteredComplexes = complexesWithFieldCount.filter(complex => {
                         const complexStatus = complex.status || complex.Status || "Active";
                         return complexStatus === statusFilter;
                    });
               }

               setComplexes(filteredComplexes);

               // Lấy tất cả fields từ tất cả complexes
               const allFieldsPromises = allComplexes.map(async (complex) => {
                    try {
                         const fields = await fetchFields({ complexId: complex.complexId });
                         return fields.map(field => ({
                              ...field,
                              complexName: complex.name || complex.Name || "",
                              complexAddress: complex.address || complex.Address || "",
                              complexStatus: complex.status || complex.Status || "Active",
                              ownerName: complex.ownerName || complex.OwnerName || "",
                              ownerEmail: complex.ownerEmail || complex.OwnerEmail || ""
                         }));
                    } catch (error) {
                         console.error(`Error fetching fields for complex ${complex.complexId}:`, error);
                         return [];
                    }
               });

               const allFieldsArrays = await Promise.all(allFieldsPromises);
               const allFields = allFieldsArrays.flat();

               // Filter fields theo status
               let filteredFields = allFields;
               if (statusFilter !== "all") {
                    filteredFields = allFields.filter(field => {
                         const fieldStatus = field.status || field.Status || "Available";
                         const complexStatus = field.complexStatus || "Active";

                         if (statusFilter === "Pending") {
                              return complexStatus === "Pending";
                         } else if (statusFilter === "Active") {
                              return complexStatus === "Active" && (fieldStatus === "Available" || fieldStatus === "Active");
                         } else if (statusFilter === "Rejected") {
                              return complexStatus === "Rejected";
                         }
                         return true;
                    });
               }

               setFields(filteredFields);
          } catch (error) {
               console.error("Error loading data:", error);
               Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể tải danh sách. Vui lòng thử lại sau.",
                    confirmButtonText: "Đóng"
               });
          } finally {
               setIsLoading(false);
               setIsRefreshing(false);
          }
     };

     const handleViewItem = async (item) => {
          try {
               if (viewMode === "complexes") {
                    // Xem chi tiết khu sân
                    const complexDetail = await fetchFieldComplex(item.complexId || item.ComplexID);
                    // Lấy danh sách sân trong khu sân
                    const fieldsInComplex = await fetchFields({ complexId: item.complexId || item.ComplexID });
                    setSelectedItem({
                         ...complexDetail,
                         type: "complex",
                         fields: fieldsInComplex || []
                    });
               } else {
                    // Xem chi tiết sân nhỏ
                    const fieldDetail = await fetchField(item.fieldId);
                    setSelectedItem({
                         ...fieldDetail,
                         type: "field",
                         complexName: item.complexName,
                         complexAddress: item.complexAddress,
                         complexStatus: item.complexStatus,
                         ownerName: item.ownerName,
                         ownerEmail: item.ownerEmail
                    });
               }
               setShowDetailModal(true);
          } catch (error) {
               console.error("Error fetching detail:", error);
               Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể tải chi tiết.",
                    confirmButtonText: "Đóng"
               });
          }
     };

     const handleApproveItem = async (item) => {
          const itemName = viewMode === "complexes"
               ? (item.name || item.Name || "khu sân này")
               : (item.name || "sân này");
          const itemType = viewMode === "complexes" ? "khu sân" : "sân";

          const result = await Swal.fire({
               title: `Xác nhận duyệt ${itemType}?`,
               text: `Bạn có chắc chắn muốn duyệt ${itemType} "${itemName}"?`,
               icon: "question",
               showCancelButton: true,
               confirmButtonColor: "#10b981",
               cancelButtonColor: "#6b7280",
               confirmButtonText: "Duyệt",
               cancelButtonText: "Hủy"
          });

          if (result.isConfirmed) {
               try {
                    setIsRefreshing(true);
                    // Cập nhật status của complex thành "Active"
                    const complexId = viewMode === "complexes"
                         ? (item.complexId || item.ComplexID)
                         : (item.complexId || item.complexID || item.ComplexID);

                    if (complexId) {
                         await updateFieldComplex(complexId, {
                              status: "Active"
                         });
                    }

                    Swal.fire({
                         icon: "success",
                         title: "Đã duyệt!",
                         text: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} đã được duyệt thành công.`,
                         timer: 2000,
                         showConfirmButton: false
                    });

                    await loadData();
                    if (showDetailModal) {
                         setShowDetailModal(false);
                    }
               } catch (error) {
                    console.error("Error approving item:", error);
                    Swal.fire({
                         icon: "error",
                         title: "Lỗi",
                         text: error.message || `Không thể duyệt ${itemType}.`,
                         confirmButtonText: "Đóng"
                    });
               } finally {
                    setIsRefreshing(false);
               }
          }
     };

     const handleRejectItem = async (item) => {
          const itemName = viewMode === "complexes"
               ? (item.name || item.Name || "khu sân này")
               : (item.name || "sân này");
          const itemType = viewMode === "complexes" ? "khu sân" : "sân";

          const result = await Swal.fire({
               title: `Từ chối ${itemType}?`,
               text: `Bạn có chắc chắn muốn từ chối ${itemType} "${itemName}"?`,
               input: "textarea",
               inputLabel: "Lý do từ chối (tùy chọn)",
               inputPlaceholder: "Nhập lý do từ chối...",
               icon: "warning",
               showCancelButton: true,
               confirmButtonColor: "#ef4444",
               cancelButtonColor: "#6b7280",
               confirmButtonText: "Từ chối",
               cancelButtonText: "Hủy"
          });

          if (result.isConfirmed) {
               try {
                    setIsRefreshing(true);
                    // Cập nhật status của complex thành "Rejected"
                    const complexId = viewMode === "complexes"
                         ? (item.complexId || item.ComplexID)
                         : (item.complexId || item.complexID || item.ComplexID);

                    if (complexId) {
                         await updateFieldComplex(complexId, {
                              status: "Rejected",
                              rejectionReason: result.value || ""
                         });
                    }

                    Swal.fire({
                         icon: "success",
                         title: "Đã từ chối!",
                         text: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} đã được từ chối thành công.`,
                         timer: 2000,
                         showConfirmButton: false
                    });

                    await loadData();
                    if (showDetailModal) {
                         setShowDetailModal(false);
                    }
               } catch (error) {
                    console.error("Error rejecting item:", error);
                    Swal.fire({
                         icon: "error",
                         title: "Lỗi",
                         text: error.message || `Không thể từ chối ${itemType}.`,
                         confirmButtonText: "Đóng"
                    });
               } finally {
                    setIsRefreshing(false);
               }
          }
     };

     const getStatusBadgeVariant = (status) => {
          switch (status) {
               case "Pending":
                    return "bg-yellow-100 text-yellow-800 border-yellow-200";
               case "Active":
                    return "bg-green-100 text-green-800 border-green-200";
               case "Rejected":
                    return "bg-red-100 text-red-800 border-red-200";
               default:
                    return "bg-gray-100 text-gray-800 border-gray-200";
          }
     };

     const getStatusLabel = (status) => {
          switch (status) {
               case "Pending":
                    return "Chờ duyệt";
               case "Active":
                    return "Đã duyệt";
               case "Rejected":
                    return "Đã từ chối";
               default:
                    return status || "Không xác định";
          }
     };

     const stats = {
          total: viewMode === "complexes" ? complexes.length : fields.length,
          pending: viewMode === "complexes"
               ? complexes.filter(c => (c.status || c.Status || "Active") === "Pending").length
               : fields.filter(f => (f.complexStatus || "Active") === "Pending").length,
          approved: viewMode === "complexes"
               ? complexes.filter(c => (c.status || c.Status || "Active") === "Active").length
               : fields.filter(f => (f.complexStatus || "Active") === "Active").length,
          rejected: viewMode === "complexes"
               ? complexes.filter(c => (c.status || c.Status || "Active") === "Rejected").length
               : fields.filter(f => (f.complexStatus || "Active") === "Rejected").length
     };

     // Columns cho khu sân
     const complexColumns = [
          {
               key: "complex",
               label: "Khu sân",
               render: (complex) => (
                    <div className="flex items-center space-x-3">
                         <Avatar className="w-10 h-10">
                              {complex.imageUrl ? (
                                   <AvatarImage src={complex.imageUrl} alt={complex.name || complex.Name} />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                   {(complex.name || complex.Name || "Khu sân").charAt(0)}
                              </AvatarFallback>
                         </Avatar>
                         <div>
                              <p className="font-medium text-slate-900">{complex.name || complex.Name || "N/A"}</p>
                              <p className="text-sm text-slate-500">{complex.address || complex.Address || "N/A"}</p>
                         </div>
                    </div>
               )
          },
          {
               key: "owner",
               label: "Chủ sân",
               render: (complex) => (
                    <div className="flex items-center space-x-2">
                         <User className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">{complex.ownerName || complex.OwnerName || "N/A"}</span>
                    </div>
               )
          },
          {
               key: "status",
               label: "Trạng thái",
               render: (complex) => {
                    const status = complex.status || complex.Status || "Active";
                    return (
                         <Badge className={getStatusBadgeVariant(status)}>
                              {getStatusLabel(status)}
                         </Badge>
                    );
               }
          },
          {
               key: "fieldCount",
               label: "Số sân",
               render: (complex) => (
                    <div className="flex items-center space-x-2">
                         <Building className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">{complex.fieldCount || 0}</span>
                    </div>
               )
          },
          {
               key: "actions",
               label: "Thao tác",
               render: (complex) => {
                    const status = complex.status || complex.Status || "Active";
                    return (
                         <div className="flex items-center space-x-2">
                              <Button
                                   onClick={() => handleViewItem(complex)}
                                   variant="ghost"
                                   size="sm"
                                   className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                   title="Xem chi tiết"
                              >
                                   <Eye className="w-4 h-4" />
                              </Button>
                              {status === "Pending" && (
                                   <>
                                        <Button
                                             onClick={() => handleApproveItem(complex)}
                                             variant="ghost"
                                             size="sm"
                                             className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                             title="Duyệt khu sân"
                                        >
                                             <CheckCircle className="w-4 h-4" />
                                        </Button>
                                        <Button
                                             onClick={() => handleRejectItem(complex)}
                                             variant="ghost"
                                             size="sm"
                                             className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                             title="Từ chối khu sân"
                                        >
                                             <XCircle className="w-4 h-4" />
                                        </Button>
                                   </>
                              )}
                         </div>
                    );
               }
          }
     ];

     // Columns cho sân nhỏ
     const fieldColumns = [
          {
               key: "field",
               label: "Sân",
               render: (field) => (
                    <div className="flex items-center space-x-3">
                         <Avatar className="w-10 h-10">
                              {field.mainImageUrl ? (
                                   <AvatarImage src={field.mainImageUrl} alt={field.name} />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white">
                                   {(field.name || "Sân").charAt(0)}
                              </AvatarFallback>
                         </Avatar>
                         <div>
                              <p className="font-medium text-slate-900">{field.name || "N/A"}</p>
                              <p className="text-sm text-slate-500">{field.complexName || "N/A"}</p>
                         </div>
                    </div>
               )
          },
          {
               key: "complex",
               label: "Khu sân",
               render: (field) => (
                    <div className="flex items-center space-x-2">
                         <Building className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">{field.complexName || "N/A"}</span>
                    </div>
               )
          },
          {
               key: "owner",
               label: "Chủ sân",
               render: (field) => (
                    <div className="flex items-center space-x-2">
                         <User className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">{field.fullName || "N/A"}</span>
                    </div>
               )
          },
          {
               key: "status",
               label: "Trạng thái",
               render: (field) => {
                    const status = field.complexStatus || "Active";
                    return (
                         <Badge className={getStatusBadgeVariant(status)}>
                              {getStatusLabel(status)}
                         </Badge>
                    );
               }
          },
          {
               key: "price",
               label: "Giá/giờ",
               render: (field) => (
                    <div className="flex items-center space-x-2">
                         <DollarSign className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">
                              {field.pricePerHour ? `${field.pricePerHour.toLocaleString('vi-VN')} đ` : "N/A"}
                         </span>
                    </div>
               )
          },
          {
               key: "actions",
               label: "Thao tác",
               render: (field) => {
                    const status = field.complexStatus || "Active";
                    return (
                         <div className="flex items-center space-x-2">
                              <Button
                                   onClick={() => handleViewItem(field)}
                                   variant="ghost"
                                   size="sm"
                                   className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                   title="Xem chi tiết"
                              >
                                   <Eye className="w-4 h-4" />
                              </Button>
                              {status === "Pending" && (
                                   <>
                                        <Button
                                             onClick={() => handleApproveItem(field)}
                                             variant="ghost"
                                             size="sm"
                                             className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                             title="Duyệt sân"
                                        >
                                             <CheckCircle className="w-4 h-4" />
                                        </Button>
                                        <Button
                                             onClick={() => handleRejectItem(field)}
                                             variant="ghost"
                                             size="sm"
                                             className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                             title="Từ chối sân"
                                        >
                                             <XCircle className="w-4 h-4" />
                                        </Button>
                                   </>
                              )}
                         </div>
                    );
               }
          }
     ];

     // Chọn columns dựa trên viewMode
     const columns = viewMode === "complexes" ? complexColumns : fieldColumns;

     if (isLoading && (viewMode === "complexes" ? complexes.length === 0 : fields.length === 0)) {
          return (
               <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center text-slate-600 space-y-3">
                         <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-200 border-t-red-600 mx-auto"></div>
                         <p>Đang tải dữ liệu...</p>
                    </div>
               </div>
          );
     }

     return (
          <div className="space-y-6">
               {/* Header */}
               <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 shadow-md border border-red-200/50">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-pink-700 bg-clip-text text-transparent">
                                   Quản lý sân
                              </h1>
                              <p className="text-slate-600 mt-2 font-medium">
                                   Xem và xác nhận thêm sân từ phía owner
                              </p>
                         </div>
                         <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <Building className="w-8 h-8 text-white" />
                         </div>
                    </div>
               </div>

               {/* Filters */}
               <Card className="p-6 rounded-2xl shadow-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                         <div className="flex-1">
                              <div className="relative">
                                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                   <Input
                                        placeholder={viewMode === "complexes"
                                             ? "Tìm kiếm theo tên khu sân, địa chỉ, chủ sân..."
                                             : "Tìm kiếm theo tên sân, khu sân..."}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 rounded-2xl"
                                   />
                              </div>
                         </div>
                         <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
                              {/* Tabs để chuyển đổi giữa khu sân và sân nhỏ */}
                              <div className="flex bg-slate-100 rounded-2xl border border-slate-200 p-1">
                                   <Button
                                        variant={viewMode === "complexes" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setViewMode("complexes")}
                                        className={`rounded-xl ${viewMode === "complexes" ? "bg-teal-600 shadow-sm text-white hover:text-white hover:bg-teal-700" : ""}`}
                                   >
                                        <Building className="w-4 h-4 mr-2" />
                                        Khu sân
                                   </Button>
                                   <Button
                                        variant={viewMode === "fields" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setViewMode("fields")}
                                        className={`rounded-xl ${viewMode === "fields" ? "bg-teal-600 shadow-sm text-white hover:text-white hover:bg-teal-700" : ""}`}
                                   >
                                        Sân nhỏ
                                   </Button>
                              </div>
                              <Select value={statusFilter} onValueChange={setStatusFilter}>
                                   <SelectTrigger className="w-48 rounded-2xl">
                                        <SelectValue placeholder="Chọn trạng thái" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="Pending">Chờ duyệt</SelectItem>
                                        <SelectItem value="Active">Đã duyệt</SelectItem>
                                        <SelectItem value="Rejected">Đã từ chối</SelectItem>
                                   </SelectContent>
                              </Select>
                              <Button
                                   variant="outline"
                                   className="rounded-2xl"
                                   onClick={() => loadData()}
                                   disabled={isLoading || isRefreshing}
                              >
                                   <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                                   {isRefreshing ? "Đang tải..." : "Làm mới"}
                              </Button>
                         </div>
                    </div>
               </Card>

               {/* Stats */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Tổng sân</p>
                                   <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                              </div>
                              <Building className="w-8 h-8 text-blue-600" />
                         </div>
                    </Card>
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Chờ duyệt</p>
                                   <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                              </div>
                              <Calendar className="w-8 h-8 text-yellow-600" />
                         </div>
                    </Card>
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Đã duyệt</p>
                                   <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
                              </div>
                              <CheckCircle className="w-8 h-8 text-green-600" />
                         </div>
                    </Card>
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Đã từ chối</p>
                                   <p className="text-2xl font-bold text-slate-900">{stats.rejected}</p>
                              </div>
                              <XCircle className="w-8 h-8 text-red-600" />
                         </div>
                    </Card>
               </div>

               {/* Data Table */}
               <Card className="p-6 rounded-2xl shadow-lg space-y-4">
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold text-slate-900">
                              {viewMode === "complexes"
                                   ? `Danh sách khu sân (${filteredData.length})`
                                   : `Danh sách sân nhỏ (${filteredData.length})`}
                         </h3>
                    </div>
                    {filteredData.length === 0 ? (
                         <div className="text-center py-8 text-slate-500">
                              Hiện chưa có {viewMode === "complexes" ? "khu sân" : "sân"} nào phù hợp với bộ lọc
                         </div>
                    ) : (
                         <Table className="w-full rounded-2xl shadow-lg border border-slate-200">
                              <TableHeader>
                                   <TableRow >
                                        {columns.map((column) => (
                                             <TableHead key={column.key} className="truncate">{column.label}</TableHead>
                                        ))}
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {filteredData.map((item) => {
                                        const key = viewMode === "complexes"
                                             ? (item.complexId || item.ComplexID)
                                             : (item.fieldId || item.FieldID);
                                        return (
                                             <TableRow key={key}>
                                                  {columns.map((column) => (
                                                       <TableCell key={column.key}>
                                                            {column.render(item)}
                                                       </TableCell>
                                                  ))}
                                             </TableRow>
                                        );
                                   })}
                              </TableBody>
                         </Table>
                    )}
               </Card>

               {/* Detail Modal */}
               <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title={selectedItem?.type === "complex" ? "Chi tiết khu sân" : "Chi tiết sân"}
                    size="4xl"
                    className="max-h-[90vh] rounded-2xl shadow-lg border overflow-y-auto border-slate-200 max-w-2xl scrollbar-hide"
               >
                    {selectedItem && (
                         <div className="space-y-4 px-3">
                              {selectedItem.type === "complex" ? (
                                   <>
                                        {/* Chi tiết khu sân */}
                                        <div>
                                             <h4 className="text-2xl font-bold text-slate-900 mb-2">
                                                  {selectedItem.name || selectedItem.Name || "N/A"}
                                             </h4>
                                             <div className="flex items-center space-x-4 text-sm text-slate-600">
                                                  <Badge className={getStatusBadgeVariant(selectedItem.status || selectedItem.Status)}>
                                                       {getStatusLabel(selectedItem.status || selectedItem.Status)}
                                                  </Badge>
                                             </div>
                                        </div>

                                        {selectedItem.imageUrl && (
                                             <div>
                                                  <img
                                                       src={selectedItem.imageUrl}
                                                       alt={selectedItem.name || selectedItem.Name}
                                                       className="w-full h-auto rounded-2xl border border-slate-200"
                                                  />
                                             </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600">Chủ sân</p>
                                                  <p className="text-slate-900">{selectedItem.ownerName || selectedItem.OwnerName || "N/A"}</p>
                                             </div>
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600">Email</p>
                                                  <p className="text-slate-900">{selectedItem.ownerEmail || selectedItem.OwnerEmail || "N/A"}</p>
                                             </div>
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600">Địa chỉ</p>
                                                  <p className="text-slate-900">{selectedItem.address || selectedItem.Address || "N/A"}</p>
                                             </div>
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600">Số sân</p>
                                                  <p className="text-slate-900">{selectedItem.fields?.length || 0}</p>
                                             </div>
                                        </div>

                                        {selectedItem.description && (
                                             <div>
                                                  <h5 className="text-lg font-bold text-slate-900 mb-1">Mô tả:</h5>
                                                  <p className="text-slate-900 whitespace-pre-wrap leading-relaxed">
                                                       {selectedItem.description || selectedItem.Description}
                                                  </p>
                                             </div>
                                        )}

                                        {/* Danh sách sân trong khu sân */}
                                        {selectedItem.fields && selectedItem.fields.length > 0 && (
                                             <div>
                                                  <h5 className="text-lg font-bold text-slate-900 mb-3">Danh sách sân trong khu sân:</h5>
                                                  <div className="space-y-2">
                                                       {selectedItem.fields.map((field) => (
                                                            <div key={field.fieldId} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                                 <p className="font-medium text-slate-900">{field.name || "N/A"}</p>
                                                                 <p className="text-sm text-slate-600">
                                                                      Giá: {field.pricePerHour ? `${field.pricePerHour.toLocaleString('vi-VN')} đ/giờ` : "N/A"}
                                                                 </p>
                                                            </div>
                                                       ))}
                                                  </div>
                                             </div>
                                        )}

                                        {(selectedItem.status || selectedItem.Status) === "Pending" && (
                                             <div className="flex space-x-3 pt-4 border-t border-slate-200">
                                                  <Button
                                                       onClick={() => {
                                                            setShowDetailModal(false);
                                                            handleApproveItem(selectedItem);
                                                       }}
                                                       className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-2xl"
                                                  >
                                                       <CheckCircle className="w-4 h-4 mr-2" />
                                                       Duyệt khu sân
                                                  </Button>
                                                  <Button
                                                       onClick={() => {
                                                            setShowDetailModal(false);
                                                            handleRejectItem(selectedItem);
                                                       }}
                                                       className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-2xl"
                                                  >
                                                       <XCircle className="w-4 h-4 mr-2" />
                                                       Từ chối khu sân
                                                  </Button>
                                             </div>
                                        )}
                                   </>
                              ) : (
                                   <>
                                        {/* Chi tiết sân nhỏ */}
                                        <div>
                                             <h4 className="text-2xl font-bold text-slate-900 mb-2">{selectedItem.name || "N/A"}</h4>
                                             <div className="flex items-center space-x-4 text-sm text-slate-600">
                                                  <div className="flex items-center space-x-1">
                                                       <Building className="w-4 h-4" />
                                                       <span>{selectedItem.complexName || "N/A"}</span>
                                                  </div>
                                                  <Badge className={getStatusBadgeVariant(selectedItem.complexStatus)}>
                                                       {getStatusLabel(selectedItem.complexStatus)}
                                                  </Badge>
                                             </div>
                                        </div>

                                        {selectedItem.mainImageUrl && (
                                             <div>
                                                  <img
                                                       src={selectedItem.mainImageUrl}
                                                       alt={selectedItem.name}
                                                       className="w-full h-auto rounded-2xl border border-slate-200"
                                                  />
                                             </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600">Khu sân</p>
                                                  <p className="text-slate-900">{selectedItem.complexName || "N/A"}</p>
                                             </div>
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600">Chủ sân</p>
                                                  <p className="text-slate-900">{selectedItem.ownerName || "N/A"}</p>
                                             </div>
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600">Email</p>
                                                  <p className="text-slate-900">{selectedItem.ownerEmail || "N/A"}</p>
                                             </div>
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600">Địa chỉ</p>
                                                  <p className="text-slate-900">{selectedItem.complexAddress || "N/A"}</p>
                                             </div>
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600">Giá/giờ</p>
                                                  <p className="text-slate-900">
                                                       {selectedItem.pricePerHour ? `${selectedItem.pricePerHour.toLocaleString('vi-VN')} đ` : "N/A"}
                                                  </p>
                                             </div>
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600">Kích thước</p>
                                                  <p className="text-slate-900">{selectedItem.size || "N/A"}</p>
                                             </div>
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600">Loại cỏ</p>
                                                  <p className="text-slate-900">{selectedItem.grassType || "N/A"}</p>
                                             </div>
                                        </div>

                                        {selectedItem.description && (
                                             <div>
                                                  <h5 className="text-lg font-bold text-slate-900 mb-1">Mô tả:</h5>
                                                  <p className="text-slate-900 whitespace-pre-wrap leading-relaxed">
                                                       {selectedItem.description}
                                                  </p>
                                             </div>
                                        )}

                                        {selectedItem.complexStatus === "Pending" && (
                                             <div className="flex space-x-3 pt-4 border-t border-slate-200">
                                                  <Button
                                                       onClick={() => {
                                                            setShowDetailModal(false);
                                                            handleApproveItem(selectedItem);
                                                       }}
                                                       className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-2xl"
                                                  >
                                                       <CheckCircle className="w-4 h-4 mr-2" />
                                                       Duyệt sân
                                                  </Button>
                                                  <Button
                                                       onClick={() => {
                                                            setShowDetailModal(false);
                                                            handleRejectItem(selectedItem);
                                                       }}
                                                       className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-2xl"
                                                  >
                                                       <XCircle className="w-4 h-4 mr-2" />
                                                       Từ chối sân
                                                  </Button>
                                             </div>
                                        )}
                                   </>
                              )}
                         </div>
                    )}
               </Modal>
          </div>
     );
}

