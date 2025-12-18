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
     RefreshCw
} from "lucide-react";
import { fetchFieldComplexes, fetchFieldComplex, fetchFieldsByComplex, updateFieldComplex } from "../../../shared/services/fields";
import { profileService } from "../../../shared/services/profileService";
import Swal from "sweetalert2";

export default function FieldManagement() {
     const [complexes, setComplexes] = useState([]);
     const [filteredData, setFilteredData] = useState([]);
     const [searchTerm, setSearchTerm] = useState("");
     const [statusFilter, setStatusFilter] = useState("Pending");
     const [selectedItem, setSelectedItem] = useState(null);
     const [showDetailModal, setShowDetailModal] = useState(false);
     const [isLoading, setIsLoading] = useState(true);
     const [isRefreshing, setIsRefreshing] = useState(false);

     useEffect(() => {
          loadData();
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [statusFilter]);

     useEffect(() => {
          let filtered = complexes;

          // Filter by search term
          if (searchTerm) {
               const searchValue = searchTerm.toLowerCase();
               filtered = filtered.filter(complex =>
                    (complex.name || complex.Name || "").toLowerCase().includes(searchValue) ||
                    (complex.address || complex.Address || "").toLowerCase().includes(searchValue) ||
                    (complex.ownerName || complex.OwnerName || "").toLowerCase().includes(searchValue)
               );
          }

          setFilteredData(filtered);
     }, [complexes, searchTerm]);

     const loadData = async () => {
          try {
               setIsLoading(true);
               // Lấy tất cả complexes
               const allComplexes = await fetchFieldComplexes();

               // Lấy số lượng sân và thông tin chủ sân cho mỗi complex
               const complexesWithFieldCount = await Promise.all(
                    allComplexes.map(async (complex) => {
                         try {
                              // Sử dụng fetchFieldsByComplex để lấy tất cả sân (kể cả của khu sân Pending)
                              const fields = await fetchFieldsByComplex(complex.complexId);

                              // Lấy thông tin chủ sân từ API PlayerProfile
                              let ownerProfile = null;
                              const ownerId = complex.ownerId || complex.OwnerId;
                              if (ownerId) {
                                   try {
                                        const profileResponse = await profileService.getPlayerProfile(ownerId);
                                        if (profileResponse.ok) {
                                             ownerProfile = profileResponse.data;
                                        }
                                   } catch (profileError) {
                                        console.error(`Error fetching owner profile for complex ${complex.complexId}:`, profileError);
                                   }
                              }

                              return {
                                   ...complex,
                                   fieldCount: Array.isArray(fields) ? fields.length : 0,
                                   ownerProfile: ownerProfile,
                                   ownerName: ownerProfile?.fullName || complex.ownerName || complex.OwnerName || "",
                                   ownerEmail: ownerProfile?.email || complex.ownerEmail || complex.OwnerEmail || "",
                                   ownerPhone: ownerProfile?.phone || ownerProfile?.phoneNumber || ""
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
               // Xem chi tiết khu sân
               const complexDetail = await fetchFieldComplex(item.complexId || item.ComplexID);
               // Lấy danh sách sân trong khu sân
               const fieldsInComplex = await fetchFieldsByComplex(item.complexId || item.ComplexID);

               // Lấy thông tin chủ sân qua API PlayerProfile
               let ownerProfile = null;
               const ownerId = complexDetail.ownerId || complexDetail.OwnerId || item.ownerId;
               if (ownerId) {
                    try {
                         const profileResponse = await profileService.getPlayerProfile(ownerId);
                         if (profileResponse.ok) {
                              ownerProfile = profileResponse.data;
                         }
                    } catch (profileError) {
                         console.error("Error fetching owner profile:", profileError);
                    }
               }

               setSelectedItem({
                    ...complexDetail,
                    type: "complex",
                    fields: fieldsInComplex || [],
                    ownerProfile: ownerProfile
               });
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
          const itemName = item.name || item.Name || "khu sân này";

          const result = await Swal.fire({
               title: "Xác nhận duyệt khu sân?",
               text: `Bạn có chắc chắn muốn duyệt khu sân "${itemName}"?`,
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
                    const complexId = item.complexId || item.ComplexID;

                    if (complexId) {
                         // Lấy thông tin đầy đủ của complex trước khi cập nhật
                         const complexDetail = await fetchFieldComplex(complexId);

                         // Tạo FormData để gửi đầy đủ thông tin
                         const formData = new FormData();
                         formData.append("ComplexId", String(complexId));
                         formData.append("OwnerId", String(complexDetail.ownerId || complexDetail.OwnerId));
                         formData.append("Name", complexDetail.name || complexDetail.Name || "");
                         formData.append("Address", complexDetail.address || complexDetail.Address || "");
                         formData.append("Description", complexDetail.description || complexDetail.Description || "");
                         formData.append("Status", "Active");

                         // Thêm tọa độ nếu có
                         if (complexDetail.lat || complexDetail.Lat) {
                              formData.append("Lat", String(complexDetail.lat || complexDetail.Lat));
                         }
                         if (complexDetail.lng || complexDetail.Lng) {
                              formData.append("Lng", String(complexDetail.lng || complexDetail.Lng));
                         }
                         if (complexDetail.ward || complexDetail.Ward) {
                              formData.append("Ward", complexDetail.ward || complexDetail.Ward);
                         }
                         if (complexDetail.district || complexDetail.District) {
                              formData.append("District", complexDetail.district || complexDetail.District);
                         }
                         if (complexDetail.province || complexDetail.Province) {
                              formData.append("Province", complexDetail.province || complexDetail.Province);
                         }

                         await updateFieldComplex(complexId, formData);
                    }

                    Swal.fire({
                         icon: "success",
                         title: "Đã duyệt!",
                         text: "Khu sân đã được duyệt thành công.",
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
                         text: error.message || "Không thể duyệt khu sân.",
                         confirmButtonText: "Đóng"
                    });
               } finally {
                    setIsRefreshing(false);
               }
          }
     };

     const handleRejectItem = async (item) => {
          const itemName = item.name || item.Name || "khu sân này";

          const result = await Swal.fire({
               title: "Từ chối khu sân?",
               text: `Bạn có chắc chắn muốn từ chối khu sân "${itemName}"?`,
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
                    const complexId = item.complexId || item.ComplexID;

                    if (complexId) {
                         // Lấy thông tin đầy đủ của complex trước khi cập nhật
                         const complexDetail = await fetchFieldComplex(complexId);

                         // Tạo FormData để gửi đầy đủ thông tin
                         const formData = new FormData();
                         formData.append("ComplexId", String(complexId));
                         formData.append("OwnerId", String(complexDetail.ownerId || complexDetail.OwnerId));
                         formData.append("Name", complexDetail.name || complexDetail.Name || "");
                         formData.append("Address", complexDetail.address || complexDetail.Address || "");
                         formData.append("Description", complexDetail.description || complexDetail.Description || "");
                         formData.append("Status", "Rejected");

                         // Thêm tọa độ nếu có
                         if (complexDetail.lat || complexDetail.Lat) {
                              formData.append("Lat", String(complexDetail.lat || complexDetail.Lat));
                         }
                         if (complexDetail.lng || complexDetail.Lng) {
                              formData.append("Lng", String(complexDetail.lng || complexDetail.Lng));
                         }
                         if (complexDetail.ward || complexDetail.Ward) {
                              formData.append("Ward", complexDetail.ward || complexDetail.Ward);
                         }
                         if (complexDetail.district || complexDetail.District) {
                              formData.append("District", complexDetail.district || complexDetail.District);
                         }
                         if (complexDetail.province || complexDetail.Province) {
                              formData.append("Province", complexDetail.province || complexDetail.Province);
                         }

                         await updateFieldComplex(complexId, formData);
                    }

                    Swal.fire({
                         icon: "success",
                         title: "Đã từ chối!",
                         text: "Khu sân đã được từ chối thành công.",
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
                         text: error.message || "Không thể từ chối khu sân.",
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
          total: complexes.length,
          pending: complexes.filter(c => (c.status || c.Status || "Active") === "Pending").length,
          approved: complexes.filter(c => (c.status || c.Status || "Active") === "Active").length,
          rejected: complexes.filter(c => (c.status || c.Status || "Active") === "Rejected").length
     };

     // Columns cho khu sân
     const complexColumns = [
          {
               key: "complex",
               label: "Khu sân",
               render: (complex) => (
                    <div className="flex items-center space-x-2">
                         <Avatar className="w-8 h-8 flex-shrink-0">
                              {complex.imageUrl ? (
                                   <AvatarImage src={complex.imageUrl} alt={complex.name || complex.Name} />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs">
                                   {(complex.name || complex.Name || "K").charAt(0)}
                              </AvatarFallback>
                         </Avatar>
                         <div className="min-w-0">
                              <p className="font-medium text-slate-900 text-sm truncate ">{complex.name || complex.Name || "N/A"}</p>
                              <p className="text-xs text-slate-500 truncate max-w-[250px]">{complex.address || complex.Address || "N/A"}</p>
                         </div>
                    </div>
               )
          },
          {
               key: "owner",
               label: "Chủ sân",
               render: (complex) => (
                    <div className="min-w-0">
                         <p className="text-sm text-slate-900 truncate ">{complex.ownerName || "N/A"}</p>
                         <p className="text-xs text-slate-500 truncate ">{complex.ownerPhone || "N/A"}</p>
                    </div>
               )
          },
          {
               key: "status",
               label: "Trạng thái",
               render: (complex) => {
                    const status = complex.status || complex.Status || "Active";
                    return (
                         <Badge className={`${getStatusBadgeVariant(status)} text-xs`}>
                              {getStatusLabel(status)}
                         </Badge>
                    );
               }
          },
          {
               key: "fieldCount",
               label: "Số sân",
               render: (complex) => (
                    <span className="text-sm text-slate-600">{complex.fieldCount || 0}</span>
               )
          },
          {
               key: "actions",
               label: "Thao tác",
               render: (complex) => {
                    const status = complex.status || complex.Status || "Active";
                    return (
                         <div className="flex items-center space-x-1">
                              <Button
                                   onClick={() => handleViewItem(complex)}
                                   variant="ghost"
                                   size="sm"
                                   className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1"
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
                                             className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1"
                                             title="Duyệt khu sân"
                                        >
                                             <CheckCircle className="w-4 h-4" />
                                        </Button>
                                        <Button
                                             onClick={() => handleRejectItem(complex)}
                                             variant="ghost"
                                             size="sm"
                                             className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1"
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

     if (isLoading && complexes.length === 0) {
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
                                   Duyệt khu sân
                              </h1>
                              <p className="text-slate-600 mt-2 font-medium">
                                   Xem và duyệt khu sân mới từ phía Owner
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
                                        placeholder="Tìm kiếm theo tên khu sân, địa chỉ, chủ sân..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 rounded-2xl"
                                   />
                              </div>
                         </div>
                         <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
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
                                   <p className="text-sm font-medium text-slate-600">Tổng khu sân</p>
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
                              Danh sách khu sân ({filteredData.length})
                         </h3>
                    </div>
                    {filteredData.length === 0 ? (
                         <div className="text-center py-8 text-slate-500">
                              Hiện chưa có khu sân nào phù hợp với bộ lọc
                         </div>
                    ) : (
                         <Table className="w-full rounded-2xl shadow-lg border border-slate-200">
                              <TableHeader>
                                   <TableRow >
                                        {complexColumns.map((column) => (
                                             <TableHead key={column.key} className="truncate">{column.label}</TableHead>
                                        ))}
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {filteredData.map((item) => {
                                        const key = item.complexId || item.ComplexID;
                                        return (
                                             <TableRow key={key}>
                                                  {complexColumns.map((column) => (
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
                    title="Chi tiết khu sân"
                    size="4xl"
                    className="max-h-[90vh] rounded-2xl shadow-lg border overflow-y-auto border-slate-200 max-w-2xl scrollbar-hide"
               >
                    {selectedItem && (
                         <div className="space-y-4 px-3">
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
                                             <p className="text-slate-900">
                                                  {selectedItem.ownerProfile?.fullName || selectedItem.ownerName || selectedItem.OwnerName || "N/A"}
                                             </p>
                                        </div>
                                        <div>
                                             <p className="text-sm font-medium text-slate-600">Email</p>
                                             <p className="text-slate-900">
                                                  {selectedItem.ownerProfile?.email || selectedItem.ownerEmail || selectedItem.OwnerEmail || "N/A"}
                                             </p>
                                        </div>
                                        <div>
                                             <p className="text-sm font-medium text-slate-600">Số điện thoại</p>
                                             <p className="text-slate-900">
                                                  {selectedItem.ownerProfile?.phone || selectedItem.ownerProfile?.phoneNumber || "N/A"}
                                             </p>
                                        </div>
                                        <div>
                                             <p className="text-sm font-medium text-slate-600">Địa chỉ chủ sân</p>
                                             <p className="text-slate-900">
                                                  {selectedItem.ownerProfile?.address || "N/A"}
                                             </p>
                                        </div>
                                        <div>
                                             <p className="text-sm font-medium text-slate-600">Địa chỉ khu sân</p>
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
                         </div>
                    )}
               </Modal>
          </div>
     );
}

