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
     Textarea,
     Table,
     Modal
} from "../../components/ui";
import {
     AlertTriangle,
     Search,
     Eye,
     CheckCircle,
     Clock,
     Calendar,
     Flag,
     Shield
} from "lucide-react";

export default function ViolationReportsManagement() {
     const [reports, setReports] = useState([]);
     const [filteredReports, setFilteredReports] = useState([]);
     const [searchTerm, setSearchTerm] = useState("");
     const [statusFilter, setStatusFilter] = useState("all");
     const [typeFilter, setTypeFilter] = useState("all");
     const [selectedReport, setSelectedReport] = useState(null);
     const [showDetailModal, setShowDetailModal] = useState(false);
     const [showActionModal, setShowActionModal] = useState(false);
     const [actionType, setActionType] = useState("");
     const [actionNote, setActionNote] = useState("");

     useEffect(() => {
          // Mock data - trong thực tế sẽ gọi API
          const mockReports = [
               {
                    id: 1,
                    reportedUserID: 123,
                    reportedUserName: "Nguyễn Văn A",
                    reportedUserEmail: "user123@example.com",
                    reporterID: 456,
                    reporterName: "Trần Thị B",
                    reporterEmail: "user456@example.com",
                    reportType: "Spam",
                    description: "Người dùng này liên tục spam tin nhắn trong phần comment của các bài viết.",
                    status: "Pending",
                    createdAt: "2024-01-20T10:30:00",
                    handledBy: null,
                    handledAt: null,
                    actionTaken: null,
                    adminNote: null
               },
               {
                    id: 2,
                    reportedUserID: 789,
                    reportedUserName: "Lê Văn C",
                    reportedUserEmail: "user789@example.com",
                    reporterID: 101,
                    reporterName: "Phạm Thị D",
                    reporterEmail: "user101@example.com",
                    reportType: "Inappropriate Content",
                    description: "Đăng nội dung không phù hợp, có chứa từ ngữ thô tục và hình ảnh không phù hợp.",
                    status: "Resolved",
                    createdAt: "2024-01-19T15:45:00",
                    handledBy: 1,
                    handledAt: "2024-01-20T09:15:00",
                    actionTaken: "Warning",
                    adminNote: "Đã cảnh báo người dùng và yêu cầu xóa nội dung vi phạm."
               },
               {
                    id: 3,
                    reportedUserID: 202,
                    reportedUserName: "Hoàng Văn E",
                    reportedUserEmail: "user202@example.com",
                    reporterID: 303,
                    reporterName: "Vũ Thị F",
                    reporterEmail: "user303@example.com",
                    reportType: "Harassment",
                    description: "Quấy rối và đe dọa qua tin nhắn riêng tư.",
                    status: "In Progress",
                    createdAt: "2024-01-18T14:20:00",
                    handledBy: 1,
                    handledAt: "2024-01-19T11:30:00",
                    actionTaken: "Investigation",
                    adminNote: "Đang điều tra và thu thập thêm bằng chứng."
               },
               {
                    id: 4,
                    reportedUserID: 404,
                    reportedUserName: "Đặng Văn G",
                    reportedUserEmail: "user404@example.com",
                    reporterID: 505,
                    reporterName: "Bùi Thị H",
                    reporterEmail: "user505@example.com",
                    reportType: "Fake Information",
                    description: "Cung cấp thông tin giả mạo về sân bóng để lừa đảo người dùng khác.",
                    status: "Pending",
                    createdAt: "2024-01-17T16:10:00",
                    handledBy: null,
                    handledAt: null,
                    actionTaken: null,
                    adminNote: null
               }
          ];

          setReports(mockReports);
          setFilteredReports(mockReports);
     }, []);

     useEffect(() => {
          let filtered = reports;

          // Filter by search term
          if (searchTerm) {
               filtered = filtered.filter(report =>
                    report.reportedUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    report.description.toLowerCase().includes(searchTerm.toLowerCase())
               );
          }

          // Filter by status
          if (statusFilter !== "all") {
               filtered = filtered.filter(report => report.status === statusFilter);
          }

          // Filter by type
          if (typeFilter !== "all") {
               filtered = filtered.filter(report => report.reportType === typeFilter);
          }

          setFilteredReports(filtered);
     }, [reports, searchTerm, statusFilter, typeFilter]);

     const handleViewReport = (report) => {
          setSelectedReport(report);
          setShowDetailModal(true);
     };

     const handleTakeAction = (report, action) => {
          setSelectedReport(report);
          setActionType(action);
          setActionNote("");
          setShowActionModal(true);
     };

     const handleSubmitAction = () => {
          if (!actionNote.trim()) {
               alert("Vui lòng nhập ghi chú cho hành động này.");
               return;
          }

          const updatedReports = reports.map(report => {
               if (report.id === selectedReport.id) {
                    return {
                         ...report,
                         status: actionType === "Dismiss" ? "Resolved" : "In Progress",
                         handledBy: 1, // Current admin
                         handledAt: new Date().toISOString(),
                         actionTaken: actionType,
                         adminNote: actionNote
                    };
               }
               return report;
          });

          setReports(updatedReports);
          setShowActionModal(false);
          setShowDetailModal(false);
     };

     const getStatusBadgeColor = (status) => {
          switch (status) {
               case "Pending":
                    return "bg-yellow-100 text-yellow-800 border-yellow-200";
               case "In Progress":
                    return "bg-blue-100 text-blue-800 border-blue-200";
               case "Resolved":
                    return "bg-green-100 text-green-800 border-green-200";
               case "Dismissed":
                    return "bg-gray-100 text-gray-800 border-gray-200";
               default:
                    return "bg-gray-100 text-gray-800 border-gray-200";
          }
     };

     const getTypeBadgeColor = (type) => {
          switch (type) {
               case "Spam":
                    return "bg-red-100 text-red-800 border-red-200";
               case "Inappropriate Content":
                    return "bg-orange-100 text-orange-800 border-orange-200";
               case "Harassment":
                    return "bg-purple-100 text-purple-800 border-purple-200";
               case "Fake Information":
                    return "bg-pink-100 text-pink-800 border-pink-200";
               default:
                    return "bg-gray-100 text-gray-800 border-gray-200";
          }
     };

     const columns = [
          {
               key: "reportedUser",
               label: "Người bị báo cáo",
               render: (report) => (
                    <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                   {report.reportedUserName.charAt(0)}
                              </span>
                         </div>
                         <div>
                              <p className="font-medium text-slate-900">{report.reportedUserName}</p>
                              <p className="text-sm text-slate-500">{report.reportedUserEmail}</p>
                         </div>
                    </div>
               )
          },
          {
               key: "reporter",
               label: "Người báo cáo",
               render: (report) => (
                    <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                   {report.reporterName.charAt(0)}
                              </span>
                         </div>
                         <div>
                              <p className="font-medium text-slate-900">{report.reporterName}</p>
                              <p className="text-sm text-slate-500">{report.reporterEmail}</p>
                         </div>
                    </div>
               )
          },
          {
               key: "type",
               label: "Loại vi phạm",
               render: (report) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeBadgeColor(report.reportType)}`}>
                         {report.reportType}
                    </span>
               )
          },
          {
               key: "status",
               label: "Trạng thái",
               render: (report) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(report.status)}`}>
                         {report.status}
                    </span>
               )
          },
          {
               key: "createdAt",
               label: "Ngày báo cáo",
               render: (report) => (
                    <div className="flex items-center space-x-2">
                         <Calendar className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">
                              {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                         </span>
                    </div>
               )
          },
          {
               key: "actions",
               label: "Thao tác",
               render: (report) => (
                    <div className="flex items-center space-x-2">
                         <Button
                              onClick={() => handleViewReport(report)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                         >
                              <Eye className="w-4 h-4" />
                         </Button>
                         {report.status === "Pending" && (
                              <>
                                   <Button
                                        onClick={() => handleTakeAction(report, "Warning")}
                                        variant="ghost"
                                        size="sm"
                                        className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50"
                                   >
                                        <Flag className="w-4 h-4" />
                                   </Button>
                                   <Button
                                        onClick={() => handleTakeAction(report, "Dismiss")}
                                        variant="ghost"
                                        size="sm"
                                        className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                   >
                                        <CheckCircle className="w-4 h-4" />
                                   </Button>
                              </>
                         )}
                    </div>
               )
          }
     ];

     return (
          <div className="space-y-6">
               {/* Header */}
               <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200/50">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-pink-700 bg-clip-text text-transparent">
                                   Quản lý báo cáo vi phạm
                              </h1>
                              <p className="text-slate-600 mt-2 font-medium">
                                   Xem xét và xử lý các báo cáo vi phạm từ người dùng
                              </p>
                         </div>
                         <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <AlertTriangle className="w-8 h-8 text-white" />
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
                                        placeholder="Tìm kiếm theo tên người dùng hoặc mô tả..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                   />
                              </div>
                         </div>
                         <div className="flex space-x-4">
                              <Select value={typeFilter} onValueChange={setTypeFilter}>
                                   <SelectTrigger className="w-48 rounded-2xl">
                                        <SelectValue placeholder="Tất cả loại vi phạm" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="all">Tất cả loại vi phạm</SelectItem>
                                        <SelectItem value="Spam">Spam</SelectItem>
                                        <SelectItem value="Inappropriate Content">Nội dung không phù hợp</SelectItem>
                                        <SelectItem value="Harassment">Quấy rối</SelectItem>
                                        <SelectItem value="Fake Information">Thông tin giả</SelectItem>
                                   </SelectContent>
                              </Select>
                              <Select value={statusFilter} onValueChange={setStatusFilter}>
                                   <SelectTrigger className="w-40 rounded-2xl">
                                        <SelectValue placeholder="Tất cả trạng thái" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                        <SelectItem value="Pending">Chờ xử lý</SelectItem>
                                        <SelectItem value="In Progress">Đang xử lý</SelectItem>
                                        <SelectItem value="Resolved">Đã giải quyết</SelectItem>
                                        <SelectItem value="Dismissed">Đã bỏ qua</SelectItem>
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
                                   <p className="text-sm font-medium text-slate-600">Tổng báo cáo</p>
                                   <p className="text-2xl font-bold text-slate-900">{reports.length}</p>
                              </div>
                              <AlertTriangle className="w-8 h-8 text-red-600" />
                         </div>
                    </Card>
                    <Card className="p-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Chờ xử lý</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {reports.filter(r => r.status === "Pending").length}
                                   </p>
                              </div>
                              <Clock className="w-8 h-8 text-yellow-600" />
                         </div>
                    </Card>
                    <Card className="p-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Đang xử lý</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {reports.filter(r => r.status === "In Progress").length}
                                   </p>
                              </div>
                              <Shield className="w-8 h-8 text-blue-600" />
                         </div>
                    </Card>
                    <Card className="p-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Đã giải quyết</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {reports.filter(r => r.status === "Resolved").length}
                                   </p>
                              </div>
                              <CheckCircle className="w-8 h-8 text-green-600" />
                         </div>
                    </Card>
               </div>

               {/* Reports Table */}
               <Card className="p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-bold text-slate-900">
                              Danh sách báo cáo ({filteredReports.length})
                         </h3>
                    </div>
                    <Table
                         data={filteredReports}
                         columns={columns}
                         className="w-full"
                    />
               </Card>

               {/* Report Detail Modal */}
               <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết báo cáo vi phạm"
                    size="4xl"
                    className="max-h-[90vh] scrollbar-hide"
               >
                    {selectedReport && (
                         <div className="space-y-6">
                              {/* Report Info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-3">Người bị báo cáo</h4>
                                        <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                             <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
                                                  <span className="text-lg font-bold text-white">
                                                       {selectedReport.reportedUserName.charAt(0)}
                                                  </span>
                                             </div>
                                             <div>
                                                  <p className="font-bold text-slate-900">{selectedReport.reportedUserName}</p>
                                                  <p className="text-sm text-slate-600">{selectedReport.reportedUserEmail}</p>
                                                  <p className="text-sm text-slate-600">ID: {selectedReport.reportedUserID}</p>
                                             </div>
                                        </div>
                                   </div>

                                   <div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-3">Người báo cáo</h4>
                                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                             <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                                  <span className="text-lg font-bold text-white">
                                                       {selectedReport.reporterName.charAt(0)}
                                                  </span>
                                             </div>
                                             <div>
                                                  <p className="font-bold text-slate-900">{selectedReport.reporterName}</p>
                                                  <p className="text-sm text-slate-600">{selectedReport.reporterEmail}</p>
                                                  <p className="text-sm text-slate-600">ID: {selectedReport.reporterID}</p>
                                             </div>
                                        </div>
                                   </div>
                              </div>

                              {/* Report Details */}
                              <div>
                                   <h4 className="text-lg font-bold text-slate-900 mb-3">Thông tin báo cáo</h4>
                                   <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                             <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeBadgeColor(selectedReport.reportType)}`}>
                                                  {selectedReport.reportType}
                                             </span>
                                             <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(selectedReport.status)}`}>
                                                  {selectedReport.status}
                                             </span>
                                        </div>
                                        <div>
                                             <p className="text-sm font-medium text-slate-600 mb-1">Mô tả:</p>
                                             <p className="text-slate-900 bg-slate-50 p-3 rounded-lg border">
                                                  {selectedReport.description}
                                             </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                             <Calendar className="w-4 h-4 text-slate-400" />
                                             <span className="text-sm text-slate-600">
                                                  Ngày báo cáo: {new Date(selectedReport.createdAt).toLocaleString('vi-VN')}
                                             </span>
                                        </div>
                                   </div>
                              </div>

                              {/* Admin Actions */}
                              {selectedReport.handledBy && (
                                   <div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-3">Hành động của admin</h4>
                                        <div className="space-y-2">
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600">Hành động:</p>
                                                  <p className="text-slate-900">{selectedReport.actionTaken}</p>
                                             </div>
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600">Ghi chú:</p>
                                                  <p className="text-slate-900 bg-slate-50 p-3 rounded-lg border">
                                                       {selectedReport.adminNote}
                                                  </p>
                                             </div>
                                             <div className="flex items-center space-x-2">
                                                  <Calendar className="w-4 h-4 text-slate-400" />
                                                  <span className="text-sm text-slate-600">
                                                       Xử lý lúc: {new Date(selectedReport.handledAt).toLocaleString('vi-VN')}
                                                  </span>
                                             </div>
                                        </div>
                                   </div>
                              )}

                              {/* Action Buttons */}
                              {selectedReport.status === "Pending" && (
                                   <div className="flex space-x-3 pt-4 border-t border-slate-200">
                                        <Button
                                             onClick={() => handleTakeAction(selectedReport, "Warning")}
                                             className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                                        >
                                             <Flag className="w-4 h-4 mr-2" />
                                             Cảnh báo
                                        </Button>
                                        <Button
                                             onClick={() => handleTakeAction(selectedReport, "Dismiss")}
                                             className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                                        >
                                             <CheckCircle className="w-4 h-4 mr-2" />
                                             Bỏ qua
                                        </Button>
                                   </div>
                              )}
                         </div>
                    )
                    }
               </Modal >

               {/* Action Modal */}
               < Modal
                    isOpen={showActionModal}
                    onClose={() => setShowActionModal(false)}
                    title={actionType === "Warning" ? "Cảnh báo người dùng" : "Bỏ qua báo cáo"}
                    size="2xl"
                    className="max-h-[90vh] scrollbar-hide"
               >

                    <div className="space-y-4">
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Ghi chú hành động *
                              </label>
                              <Textarea
                                   value={actionNote}
                                   onChange={(e) => setActionNote(e.target.value)}
                                   placeholder="Nhập ghi chú về hành động này..."
                                   rows={4}
                              />
                         </div>

                         <div className="flex space-x-3 pt-4 border-t border-slate-200">
                              <Button
                                   onClick={handleSubmitAction}
                                   className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-2xl"
                                   disabled={!actionNote.trim()}
                              >
                                   {actionType === "Warning" ? "Gửi cảnh báo" : "Bỏ qua báo cáo"}
                              </Button>
                              <Button
                                   onClick={() => setShowActionModal(false)}
                                   variant="outline"
                                   className="flex-1 rounded-2xl"
                              >
                                   Hủy
                              </Button>
                         </div>
                    </div>
               </Modal >
          </div >
     );
}
