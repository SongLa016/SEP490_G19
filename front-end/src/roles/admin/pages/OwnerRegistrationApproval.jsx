import React, { useState, useEffect } from "react";
import {
     Card,
     Button,
     Input,
     Textarea,
     Badge,
     Alert,
     AlertDescription,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
     Table,
     TableBody,
     TableCell,
     TableHead,
     TableHeader,
     TableRow,
     Modal
} from "../../../shared/components/ui";
import {
     UserCheck,
     UserX,
     Eye,
     FileText,
     Calendar,
     Mail,
     Building,
     Clock,
     CheckCircle,
     XCircle,
     AlertCircle,
     Search,
     Download,
     Users,
     Shield
} from "lucide-react";

export default function OwnerRegistrationApproval() {
     const [requests, setRequests] = useState([]);
     const [filteredRequests, setFilteredRequests] = useState([]);
     const [searchTerm, setSearchTerm] = useState("");
     const [statusFilter, setStatusFilter] = useState("all");
     const [showDetailModal, setShowDetailModal] = useState(false);
     const [showApprovalModal, setShowApprovalModal] = useState(false);
     const [showRejectionModal, setShowRejectionModal] = useState(false);
     const [selectedRequest, setSelectedRequest] = useState(null);
     const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
     const [approvalNotes, setApprovalNotes] = useState("");
     const [rejectionReason, setRejectionReason] = useState("");
     const [rejectionNotes, setRejectionNotes] = useState("");

     useEffect(() => {
          loadData();
     }, []);

     useEffect(() => {
          let filtered = requests;

          // Filter by search term
          if (searchTerm) {
               filtered = filtered.filter(request =>
                    request.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    request.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    request.email.toLowerCase().includes(searchTerm.toLowerCase())
               );
          }

          // Filter by status
          if (statusFilter !== "all") {
               filtered = filtered.filter(request => request.status === statusFilter);
          }

          setFilteredRequests(filtered);
     }, [requests, searchTerm, statusFilter]);

     const loadData = async () => {
          try {
               const [requestsData, statsData] = await Promise.all([
                    import("../../../shared/index").then(module =>
                         module.fetchOwnerRegistrationRequests("all")
                    ),
                    import("../../../shared/services/ownerRegistrationRequests").then(module =>
                         module.getOwnerRegistrationStats()
                    )
               ]);

               setRequests(requestsData);
               setStats(statsData);
          } catch (error) {
               console.error('Error loading data:', error);
          }
     };

     const handleViewRequest = (request) => {
          setSelectedRequest(request);
          setShowDetailModal(true);
     };

     const handleApproveRequest = (request) => {
          setSelectedRequest(request);
          setApprovalNotes("");
          setShowApprovalModal(true);
     };

     const handleRejectRequest = (request) => {
          setSelectedRequest(request);
          setRejectionReason("");
          setRejectionNotes("");
          setShowRejectionModal(true);
     };

     const confirmApproval = async () => {
          try {
               const { approveOwnerRegistrationRequest } = await import("../../../shared/services/ownerRegistrationRequests");
               await approveOwnerRegistrationRequest(selectedRequest.id, 1, approvalNotes);

               // Update local state
               setRequests(requests.map(r =>
                    r.id === selectedRequest.id
                         ? {
                              ...r,
                              status: "approved",
                              reviewedAt: new Date().toISOString(),
                              reviewedBy: 1,
                              notes: approvalNotes
                         }
                         : r
               ));

               setShowApprovalModal(false);
               setSelectedRequest(null);
               loadData(); // Refresh stats
          } catch (error) {
               console.error('Error approving request:', error);
               alert('Có lỗi xảy ra khi phê duyệt yêu cầu');
          }
     };

     const confirmRejection = async () => {
          try {
               const { rejectOwnerRegistrationRequest } = await import("../../../shared/services/ownerRegistrationRequests");
               await rejectOwnerRegistrationRequest(selectedRequest.id, 1, rejectionReason, rejectionNotes);

               // Update local state
               setRequests(requests.map(r =>
                    r.id === selectedRequest.id
                         ? {
                              ...r,
                              status: "rejected",
                              reviewedAt: new Date().toISOString(),
                              reviewedBy: 1,
                              rejectionReason: rejectionReason,
                              notes: rejectionNotes
                         }
                         : r
               ));

               setShowRejectionModal(false);
               setSelectedRequest(null);
               loadData(); // Refresh stats
          } catch (error) {
               console.error('Error rejecting request:', error);
               alert('Có lỗi xảy ra khi từ chối yêu cầu');
          }
     };

     const getStatusBadgeVariant = (status) => {
          switch (status) {
               case "pending":
                    return "secondary";
               case "approved":
                    return "default";
               case "rejected":
                    return "destructive";
               default:
                    return "outline";
          }
     };

     const getStatusIcon = (status) => {
          switch (status) {
               case "pending":
                    return Clock;
               case "approved":
                    return CheckCircle;
               case "rejected":
                    return XCircle;
               default:
                    return AlertCircle;
          }
     };

     const formatDate = (dateString) => {
          return new Date(dateString).toLocaleDateString('vi-VN', {
               year: 'numeric',
               month: '2-digit',
               day: '2-digit',
               hour: '2-digit',
               minute: '2-digit'
          });
     };

     return (
          <div className="space-y-6">
               {/* Header */}
               <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                                   Duyệt yêu cầu đăng ký Owner
                              </h1>
                              <p className="text-slate-600 mt-2 font-medium">
                                   Xem xét và phê duyệt các yêu cầu đăng ký tài khoản chủ sân
                              </p>
                         </div>
                         <div className="flex space-x-3">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                                   <Shield className="w-8 h-8 text-white" />
                              </div>
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
                                        placeholder="Tìm kiếm theo tên doanh nghiệp, người liên hệ hoặc email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                   />
                              </div>
                         </div>
                         <div className="flex space-x-4">
                              <Select value={statusFilter} onValueChange={setStatusFilter}>
                                   <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Chọn trạng thái" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                        <SelectItem value="pending">Chờ duyệt</SelectItem>
                                        <SelectItem value="approved">Đã duyệt</SelectItem>
                                        <SelectItem value="rejected">Từ chối</SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>
                    </div>
               </Card>

               {/* Stats */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Tổng yêu cầu</p>
                                   <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                              </div>
                              <FileText className="w-8 h-8 text-blue-600" />
                         </div>
                    </Card>
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Chờ duyệt</p>
                                   <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                              </div>
                              <Clock className="w-8 h-8 text-yellow-600" />
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
                                   <p className="text-sm font-medium text-slate-600">Từ chối</p>
                                   <p className="text-2xl font-bold text-slate-900">{stats.rejected}</p>
                              </div>
                              <XCircle className="w-8 h-8 text-red-600" />
                         </div>
                    </Card>
               </div>

               {/* Requests Table */}
               <Card className="p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-bold text-slate-900">
                              Danh sách yêu cầu ({filteredRequests.length})
                         </h3>
                    </div>
                    <div className="rounded-2xl border shadow-lg scrollbar-hide overflow-auto">
                         <Table>
                              <TableHeader>
                                   <TableRow>
                                        <TableHead>Tên doanh nghiệp</TableHead>
                                        <TableHead>Người liên hệ</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Ngày nộp</TableHead>
                                        <TableHead>Thao tác</TableHead>
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {filteredRequests.map((request) => {
                                        const StatusIcon = getStatusIcon(request.status);
                                        return (
                                             <TableRow key={request.id}>
                                                  <TableCell>
                                                       <div className="flex items-center space-x-2">
                                                            <Building className="w-4 h-4 text-slate-400" />
                                                            <span className="font-medium text-slate-900">{request.businessName}</span>
                                                       </div>
                                                  </TableCell>
                                                  <TableCell>
                                                       <div className="flex items-center space-x-2">
                                                            <Users className="w-4 h-4 text-slate-400" />
                                                            <span className="text-slate-900">{request.contactPerson}</span>
                                                       </div>
                                                  </TableCell>
                                                  <TableCell>
                                                       <div className="flex items-center space-x-2">
                                                            <Mail className="w-4 h-4 text-slate-400" />
                                                            <span className="text-slate-900">{request.email}</span>
                                                       </div>
                                                  </TableCell>
                                                  <TableCell>
                                                       <div className="flex items-center space-x-2">
                                                            <StatusIcon className="w-4 h-4" />
                                                            <Badge variant={getStatusBadgeVariant(request.status)}>
                                                                 {request.status === "pending" ? "Chờ duyệt" :
                                                                      request.status === "approved" ? "Đã duyệt" : "Từ chối"}
                                                            </Badge>
                                                       </div>
                                                  </TableCell>
                                                  <TableCell>
                                                       <div className="flex items-center space-x-2">
                                                            <Calendar className="w-4 h-4 text-slate-400" />
                                                            <span className="text-sm text-slate-600">
                                                                 {formatDate(request.submittedAt)}
                                                            </span>
                                                       </div>
                                                  </TableCell>
                                                  <TableCell>
                                                       <div className="flex items-center space-x-2">
                                                            <Button
                                                                 onClick={() => handleViewRequest(request)}
                                                                 variant="ghost"
                                                                 size="sm"
                                                                 className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-2xl"
                                                            >
                                                                 <Eye className="w-4 h-4" />
                                                            </Button>
                                                            {request.status === "pending" && (
                                                                 <>
                                                                      <Button
                                                                           onClick={() => handleApproveRequest(request)}
                                                                           variant="ghost"
                                                                           size="sm"
                                                                           className="text-green-600 hover:text-green-800 hover:bg-green-50 rounded-2xl"
                                                                      >
                                                                           <UserCheck className="w-4 h-4" />
                                                                      </Button>
                                                                      <Button
                                                                           onClick={() => handleRejectRequest(request)}
                                                                           variant="ghost"
                                                                           size="sm"
                                                                           className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-2xl"
                                                                      >
                                                                           <UserX className="w-4 h-4" />
                                                                      </Button>
                                                                 </>
                                                            )}
                                                       </div>
                                                  </TableCell>
                                             </TableRow>
                                        );
                                   })}
                              </TableBody>
                         </Table>
                    </div>
               </Card>

               {/* Request Detail Modal */}
               <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết yêu cầu đăng ký"
                    size="4xl"
                    className="rounded-2xl shadow-lg scrollbar-hide"
               >
                    {selectedRequest && (
                         <div className="space-y-6">
                              {/* Business Information */}
                              <div className="bg-slate-50 rounded-2xl p-4 shadow-lg">
                                   <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                        <Building className="w-5 h-5 mr-2" />
                                        Thông tin doanh nghiệp
                                   </h4>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                             <label className="text-sm font-medium text-slate-600">Tên doanh nghiệp</label>
                                             <p className="text-slate-900">{selectedRequest.businessName}</p>
                                        </div>
                                        <div>
                                             <label className="text-sm font-medium text-slate-600">Loại hình</label>
                                             <p className="text-slate-900">{selectedRequest.businessType}</p>
                                        </div>
                                        <div>
                                             <label className="text-sm font-medium text-slate-600">Mã số thuế</label>
                                             <p className="text-slate-900">{selectedRequest.taxCode}</p>
                                        </div>
                                        <div>
                                             <label className="text-sm font-medium text-slate-600">Giấy phép kinh doanh</label>
                                             <p className="text-slate-900">{selectedRequest.businessLicense}</p>
                                        </div>
                                   </div>
                                   <div className="mt-4">
                                        <label className="text-sm font-medium text-slate-600">Mô tả</label>
                                        <p className="text-slate-900">{selectedRequest.description}</p>
                                   </div>
                              </div>

                              {/* Contact Information */}
                              <div className="bg-slate-50 rounded-2xl p-4 shadow-lg">
                                   <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                        <Users className="w-5 h-5 mr-2" />
                                        Thông tin liên hệ
                                   </h4>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                             <label className="text-sm font-medium text-slate-600">Người liên hệ</label>
                                             <p className="text-slate-900">{selectedRequest.contactPerson}</p>
                                        </div>
                                        <div>
                                             <label className="text-sm font-medium text-slate-600">Email</label>
                                             <p className="text-slate-900">{selectedRequest.email}</p>
                                        </div>
                                        <div>
                                             <label className="text-sm font-medium text-slate-600">Số điện thoại</label>
                                             <p className="text-slate-900">{selectedRequest.phone}</p>
                                        </div>
                                        <div>
                                             <label className="text-sm font-medium text-slate-600">Địa chỉ</label>
                                             <p className="text-slate-900">{selectedRequest.address}</p>
                                        </div>
                                   </div>
                              </div>

                              {/* Documents */}
                              <div className="bg-slate-50 rounded-2xl p-4 shadow-lg">
                                   <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                        <FileText className="w-5 h-5 mr-2" />
                                        Tài liệu đính kèm
                                   </h4>
                                   <div className="space-y-2">
                                        {selectedRequest.documents.map((doc, index) => (
                                             <div key={index} className="flex items-center justify-between p-3 bg-white rounded-2xl border shadow-lg">
                                                  <div className="flex items-center space-x-3">
                                                       <FileText className="w-4 h-4 text-slate-400" />
                                                       <div>
                                                            <p className="font-medium text-slate-900">{doc.name}</p>
                                                            <p className="text-sm text-slate-500">
                                                                 Tải lên: {formatDate(doc.uploadedAt)}
                                                            </p>
                                                       </div>
                                                  </div>
                                                  <Button variant="outline" size="sm" className="rounded-2xl">
                                                       <Download className="w-4 h-4 mr-2" />
                                                       Tải xuống
                                                  </Button>
                                             </div>
                                        ))}
                                   </div>
                              </div>

                              {/* Status Information */}
                              <div className="bg-slate-50 rounded-2xl p-4 shadow-lg">
                                   <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                        <Clock className="w-5 h-5 mr-2" />
                                        Trạng thái xử lý
                                   </h4>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                             <label className="text-sm font-medium text-slate-600">Trạng thái</label>
                                             <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>
                                                  {selectedRequest.status === "pending" ? "Chờ duyệt" :
                                                       selectedRequest.status === "approved" ? "Đã duyệt" : "Từ chối"}
                                             </Badge>
                                        </div>
                                        <div>
                                             <label className="text-sm font-medium text-slate-600">Ngày nộp</label>
                                             <p className="text-slate-900">{formatDate(selectedRequest.submittedAt)}</p>
                                        </div>
                                        {selectedRequest.reviewedAt && (
                                             <>
                                                  <div>
                                                       <label className="text-sm font-medium text-slate-600">Ngày xử lý</label>
                                                       <p className="text-slate-900">{formatDate(selectedRequest.reviewedAt)}</p>
                                                  </div>
                                                  <div>
                                                       <label className="text-sm font-medium text-slate-600">Ghi chú</label>
                                                       <p className="text-slate-900">{selectedRequest.notes || "Không có"}</p>
                                                  </div>
                                             </>
                                        )}
                                        {selectedRequest.rejectionReason && (
                                             <div className="md:col-span-2">
                                                  <label className="text-sm font-medium text-slate-600">Lý do từ chối</label>
                                                  <p className="text-red-600">{selectedRequest.rejectionReason}</p>
                                             </div>
                                        )}
                                   </div>
                              </div>

                              {/* Action Buttons */}
                              {selectedRequest.status === "pending" && (
                                   <div className="flex space-x-3 pt-4 border-t border-slate-200">
                                        <Button
                                             onClick={() => {
                                                  setShowDetailModal(false);
                                                  handleApproveRequest(selectedRequest);
                                             }}
                                             className="flex-1 bg-green-600 hover:bg-green-700 rounded-2xl shadow-lg"
                                        >
                                             <UserCheck className="w-4 h-4 mr-2" />
                                             Phê duyệt
                                        </Button>
                                        <Button
                                             onClick={() => {
                                                  setShowDetailModal(false);
                                                  handleRejectRequest(selectedRequest);
                                             }}
                                             variant="outline"
                                             className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-2xl shadow-lg"
                                        >
                                             <UserX className="w-4 h-4 mr-2" />
                                             Từ chối
                                        </Button>
                                   </div>
                              )}
                         </div>
                    )}
               </Modal>

               {/* Approval Modal */}
               <Modal
                    isOpen={showApprovalModal}
                    onClose={() => setShowApprovalModal(false)}
                    title="Phê duyệt yêu cầu"
                    size="lg"
                    className="rounded-2xl shadow-lg scrollbar-hide"
               >
                    <div className="space-y-4">
                         <Alert>
                              <CheckCircle className="w-4 h-4" />
                              <AlertDescription>
                                   Bạn đang phê duyệt yêu cầu đăng ký của <strong>{selectedRequest?.businessName}</strong>
                              </AlertDescription>
                         </Alert>

                         <div className="space-y-2">
                              <label htmlFor="approval-notes" className="text-sm font-medium text-slate-700">Ghi chú (tùy chọn)</label>
                              <Textarea
                                   id="approval-notes"
                                   value={approvalNotes}
                                   onChange={(e) => setApprovalNotes(e.target.value)}
                                   placeholder="Nhập ghi chú cho việc phê duyệt..."
                                   rows={3}
                              />
                         </div>

                         <div className="flex space-x-3 pt-4 border-t border-slate-200">
                              <Button
                                   onClick={confirmApproval}
                                   className="flex-1 bg-green-600 hover:bg-green-700 rounded-2xl shadow-lg"
                              >
                                   <UserCheck className="w-4 h-4 mr-2" />
                                   Xác nhận phê duyệt
                              </Button>
                              <Button
                                   onClick={() => setShowApprovalModal(false)}
                                   variant="outline"
                                   className="flex-1 rounded-2xl shadow-lg"
                              >
                                   Hủy
                              </Button>
                         </div>
                    </div>
               </Modal>

               {/* Rejection Modal */}
               <Modal
                    isOpen={showRejectionModal}
                    onClose={() => setShowRejectionModal(false)}
                    title="Từ chối yêu cầu"
                    size="lg"
                    className="rounded-2xl shadow-lg scrollbar-hide"
               >
                    <div className="space-y-4">
                         <Alert>
                              <XCircle className="w-4 h-4" />
                              <AlertDescription>
                                   Bạn đang từ chối yêu cầu đăng ký của <strong>{selectedRequest?.businessName}</strong>
                              </AlertDescription>
                         </Alert>

                         <div className="space-y-2">
                              <label htmlFor="rejection-reason" className="text-sm font-medium text-slate-700">Lý do từ chối *</label>
                              <Textarea
                                   id="rejection-reason"
                                   value={rejectionReason}
                                   onChange={(e) => setRejectionReason(e.target.value)}
                                   placeholder="Nhập lý do từ chối yêu cầu..."
                                   rows={3}
                                   required
                              />
                         </div>

                         <div className="space-y-2">
                              <label htmlFor="rejection-notes" className="text-sm font-medium text-slate-700">Ghi chú bổ sung (tùy chọn)</label>
                              <Textarea
                                   id="rejection-notes"
                                   value={rejectionNotes}
                                   onChange={(e) => setRejectionNotes(e.target.value)}
                                   placeholder="Nhập ghi chú bổ sung..."
                                   rows={2}
                              />
                         </div>

                         <div className="flex space-x-3 pt-4 border-t border-slate-200">
                              <Button
                                   onClick={confirmRejection}
                                   className="flex-1 bg-red-600 hover:bg-red-700 rounded-2xl shadow-lg"
                                   disabled={!rejectionReason.trim()}
                              >
                                   <UserX className="w-4 h-4 mr-2" />
                                   Xác nhận từ chối
                              </Button>
                              <Button
                                   onClick={() => setShowRejectionModal(false)}
                                   variant="outline"
                                   className="flex-1 rounded-2xl shadow-lg"
                              >
                                   Hủy
                              </Button>
                         </div>
                    </div>
               </Modal>
          </div>
     );
}
